import subprocess
import tempfile
import os
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from optimizer import parse_to_ir, build_dep_graph, find_batches, run_sequential, run_parallel

with sqlite3.connect("history.db") as conn:
    conn.execute("CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, code TEXT, output TEXT)")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class CodeInput(BaseModel):
    code: str


def compile_and_run(cpp_source):
    with tempfile.NamedTemporaryFile(suffix=".cpp", mode="w", delete=False) as f:
        f.write(cpp_source)
        src = f.name
    binary = src.replace(".cpp", "")
    try:
        comp = subprocess.run(["g++", "-o", binary, src], capture_output=True, text=True, timeout=10)
        if comp.returncode != 0:
            return {"stdout": "", "stderr": comp.stderr}
        execution = subprocess.run([binary], capture_output=True, text=True, timeout=10)
        return {"stdout": execution.stdout, "stderr": execution.stderr}
    finally:
        for path in (src, binary):
            if os.path.exists(path):
                os.unlink(path)


@app.post("/optimize")
def optimize(body: CodeInput):
    compilation = compile_and_run(body.code)
    
    output_text = compilation.get("stdout", "") or compilation.get("stderr", "")
    with sqlite3.connect("history.db") as conn:
        conn.execute("INSERT INTO history (code, output) VALUES (?, ?)", (body.code, output_text))

    stmts = parse_to_ir(body.code)
    graph = build_dep_graph(stmts)
    batches = find_batches(stmts, graph)
    seq_results, seq_time = run_sequential(stmts)
    par_results, par_time = run_parallel(stmts, batches)

    return {
        "normal_output": compilation,
        "ir": [f"{s.target} = {s.op1} + {s.op2}" if s.op2 else f"{s.target} = {s.op1}" for s in stmts],
        "dependencies": graph,
        "batches": batches,
        "sequential": {"results": seq_results, "time": seq_time},
        "parallel": {"results": par_results, "time": par_time},
    }

@app.get("/history")
def get_history():
    with sqlite3.connect("history.db") as conn:
        conn.row_factory = sqlite3.Row
        return [dict(r) for r in conn.execute("SELECT id, code, output FROM history ORDER BY id DESC LIMIT 50").fetchall()]
