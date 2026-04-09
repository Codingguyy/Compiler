import sys
import time
from dataclasses import dataclass
from concurrent.futures import ProcessPoolExecutor


@dataclass
class Token:
    kind: str  # "int", "ident", "num", "+", "=", "+=", ";", ",", "(", ")"
    value: str


@dataclass
class Statement:
    target: str
    op1: str
    op2: str | None
    line_num: int


def tokenize(line):
    tokens = []
    i = 0
    while i < len(line):
        c = line[i]
        if c.isspace():
            i += 1
        elif c in ('"', "'"):
            i += 1
            while i < len(line) and line[i] != c:
                if line[i] == '\\':
                    i += 1
                i += 1
            if i < len(line):
                i += 1
        elif c == '/' and i + 1 < len(line) and line[i + 1] == '/':
            break
        elif (line[i:i+3] == 'int'
              and (i + 3 >= len(line) or not (line[i+3].isalnum() or line[i+3] == '_'))):
            tokens.append(Token("int", "int"))
            i += 3
        elif c.isalpha() or c == '_':
            j = i
            while j < len(line) and (line[j].isalnum() or line[j] == '_'):
                j += 1
            tokens.append(Token("ident", line[i:j]))
            i = j
        elif c.isdigit():
            j = i
            while j < len(line) and line[j].isdigit():
                j += 1
            tokens.append(Token("num", line[i:j]))
            i = j
        elif c == '+' and i + 1 < len(line) and line[i + 1] == '=':
            tokens.append(Token("+=", "+="))
            i += 2
        elif c == '+':
            tokens.append(Token("+", "+"))
            i += 1
        elif c == '-' and i + 1 < len(line) and line[i + 1].isdigit():
            j = i + 1
            while j < len(line) and line[j].isdigit():
                j += 1
            tokens.append(Token("num", line[i:j]))
            i = j
        elif c == '=':
            tokens.append(Token("=", "="))
            i += 1
        elif c == ';':
            tokens.append(Token(";", ";"))
            i += 1
        elif c == ',':
            tokens.append(Token(",", ","))
            i += 1
        elif c in ('(', ')'):
            tokens.append(Token(c, c))
            i += 1
        else:
            i += 1
    return tokens


def strip_parens(tokens):
    """Remove outer parens from token list: (a + b) → a + b"""
    out = [t for t in tokens if t.kind not in ("(", ")")]
    return out


def parse_expr(tokens):
    """operand ('+' operand)* — returns list of operands or None"""
    tokens = strip_parens(tokens)
    if not tokens:
        return None
    operands = []
    for i, tok in enumerate(tokens):
        if i % 2 == 0:
            if tok.kind not in ("ident", "num"):
                return None
            operands.append(tok.value)
        else:
            if tok.kind != "+":
                return None
    return operands if operands else None


def split_by_comma(tokens):
    """Split token list on ',' and ';', returning sublists."""
    segments = []
    cur = []
    for t in tokens:
        if t.kind in (",", ";"):
            if cur:
                segments.append(cur)
            cur = []
        else:
            cur.append(t)
    if cur:
        segments.append(cur)
    return segments


def has_function_call(tokens):
    """True if tokens contain ident( pattern — a function call or definition."""
    for i in range(len(tokens) - 1):
        if tokens[i].kind == "ident" and tokens[i + 1].kind == "(":
            return True
    return False


def parse_line(tokens):
    """Parse one source line into (target, operands) pairs.

    Handles:
      int x = 5;              int x = (a + b) + c;
      int x, y, z;            int x = -5;
      int x = 5, y = a + b;   x += 5;
      x = 5;                  x = a + b;
    Skips function calls (printf, main, etc).
    """
    if not tokens:
        return []

    if has_function_call(tokens):
        return []

    results = []

    if tokens[0].kind == "int":
        rest = tokens[1:]
        for seg in split_by_comma(rest):
            if not seg:
                continue
            if seg[0].kind != "ident":
                continue
            if len(seg) == 1:
                results.append((seg[0].value, ["0"]))
            elif len(seg) >= 3 and seg[1].kind == "=":
                ops = parse_expr(seg[2:])
                if ops:
                    results.append((seg[0].value, ops))
        return results

    # x += expr;  →  x = x + expr
    if tokens[0].kind == "ident" and len(tokens) >= 3 and tokens[1].kind == "+=":
        semi = len(tokens)
        for idx, t in enumerate(tokens):
            if t.kind == ";":
                semi = idx
                break
        ops = parse_expr(tokens[2:semi])
        if ops:
            return [(tokens[0].value, [tokens[0].value] + ops)]

    # x = expr;
    if tokens[0].kind == "ident" and len(tokens) >= 3 and tokens[1].kind == "=":
        semi = len(tokens)
        for idx, t in enumerate(tokens):
            if t.kind == ";":
                semi = idx
                break
        ops = parse_expr(tokens[2:semi])
        if ops:
            return [(tokens[0].value, ops)]

    return []


_temp_counter = 0


def lower_to_tac(target, operands, line_num):
    global _temp_counter

    if len(operands) == 1:
        return [Statement(target, operands[0], None, line_num)]

    stmts = []
    prev = operands[0]
    for i in range(1, len(operands)):
        if i == len(operands) - 1:
            dest = target
        else:
            dest = f"_t{_temp_counter}"
            _temp_counter += 1
        stmts.append(Statement(dest, prev, operands[i], line_num))
        prev = dest
    return stmts


def parse_to_ir(cpp_source):
    global _temp_counter
    _temp_counter = 0
    stmts = []
    for num, line in enumerate(cpp_source.strip().split('\n')):
        tokens = tokenize(line.strip())
        for target, operands in parse_line(tokens):
            stmts.extend(lower_to_tac(target, operands, num))
    return stmts


def build_dep_graph(stmts):
    targets = {}
    graph = {}
    for i, s in enumerate(stmts):
        deps = []
        for operand in (s.op1, s.op2):
            if operand and operand in targets:
                deps.append(targets[operand])
        if deps:
            graph[i] = deps
        targets[s.target] = i
    return graph


def find_batches(stmts, dep_graph):
    assigned = {}
    for i in range(len(stmts)):
        if i not in dep_graph:
            assigned[i] = 0
        else:
            assigned[i] = max(assigned[j] for j in dep_graph[i]) + 1

    if not assigned:
        return []
    num_batches = max(assigned.values()) + 1
    return [[i for i, b in assigned.items() if b == level] for level in range(num_batches)]


def execute_stmt(stmt, var_store):
    def resolve(operand):
        if operand is None:
            return 0
        return int(operand) if operand.lstrip('-').isdigit() else var_store[operand]

    a = resolve(stmt.op1)

    if stmt.op2 is None:
        return stmt.target, a

    b = resolve(stmt.op2)

    # burn CPU so parallel vs sequential difference is measurable
    x = 0
    for _ in range(50_000_000):
        x += 1

    return stmt.target, a + b


def run_sequential(stmts):
    var_store = {}
    start = time.time()
    for s in stmts:
        target, val = execute_stmt(s, var_store)
        var_store[target] = val
    return var_store, time.time() - start


def run_parallel(stmts, batches):
    var_store = {}
    start = time.time()
    with ProcessPoolExecutor() as pool:
        for batch in batches:
            futures = [pool.submit(execute_stmt, stmts[i], var_store) for i in batch]
            for f in futures:
                target, val = f.result()
                var_store[target] = val
    return var_store, time.time() - start


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("usage: python optimizer.py <input.cpp>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        source = f.read()

    stmts = parse_to_ir(source)
    graph = build_dep_graph(stmts)
    batches = find_batches(stmts, graph)

    print("IR:")
    for s in stmts:
        if s.op2:
            print(f"  {s.target} = {s.op1} + {s.op2}")
        else:
            print(f"  {s.target} = {s.op1}")

    print("\ndep graph:")
    for idx, deps in graph.items():
        print(f"  stmt {idx} -> depends on {deps}")

    print("\nbatches:")
    for i, batch in enumerate(batches):
        print(f"  {i}: statements {batch}")

    seq_results, seq_time = run_sequential(stmts)
    par_results, par_time = run_parallel(stmts, batches)

    print(f"\nsequential: {seq_time:.4f}s")
    print(f"parallel:   {par_time:.4f}s")
    if par_time > 0:
        print(f"speedup:    {seq_time / par_time:.2f}x")

    print(f"\nresults: {seq_results}")
