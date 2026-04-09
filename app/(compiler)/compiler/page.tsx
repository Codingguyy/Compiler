"use client"
import { useRouter } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Drawer, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerContent, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Terminal, SquareTerminal, Play, X, GitBranch, History } from "lucide-react"
import { MoreHorizontal } from "lucide-react"
import { Timer } from "lucide-react"
import { User } from "lucide-react"
import { RecycleIcon } from "lucide-react"
import { ArrowBigRight } from "lucide-react"
import { CircleDot } from "lucide-react"
import { SearchCode } from "lucide-react"
import { ArrowBigDown } from "lucide-react" 
import { CornerRightDown } from "lucide-react"
import Editor from "@monaco-editor/react"
import { useRef, useState, useEffect } from "react"
import type { editor } from "monaco-editor"
import { Drawervalue } from "@/components/store"

export default function CompilerEditor() {
  const router = useRouter()
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const setOptimizerResult = Drawervalue((v:any) => v.setOptimizerResult)
  const optimizerResult = Drawervalue((v:any) => v.optimizerResult)

  const [loading, setLoading] = useState(false)
  const [compileOutput, setCompileOutput] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory()
    }
  }, [isHistoryOpen])

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:8000/history", { cache: "no-store" })
      setHistory(await res.json())
    } catch {
      console.error("could not fetch history")
    }
  }

  async function handleOptimize() {
    const code = editorRef.current?.getValue()
    if (!code) return
    setLoading(true)
    setCompileOutput("")
    try {
      const res = await fetch("http://localhost:8000/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      setCompileOutput(data.normal_output?.stdout || data.normal_output?.stderr || "no output")
      setOptimizerResult(data)
    } catch {
      setCompileOutput("could not reach backend — is uvicorn running?")
    }
    setLoading(false)
  }

  function handlenavigate() {
    const code = editorRef.current?.getValue()
    if (code && !optimizerResult) {
      handleOptimize().then(() => router.push("/editor"))
      return
    }
    router.push("/editor")
  }

  return (
    <ScrollArea className="min-h-screen w-full bg-black">
      <div className="h-[70px] w-full flex items-center justify-start px-8 gap-4" style={{fontFamily:"'Robotomono',monospace"}}>
        <Terminal size={28} color="white"/>
        <div className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
          Optimizer
        </div>
        <div className="flex-1" />
        <Button variant="default" className="text-white text-sm" size={"sm"} onClick={handleOptimize} disabled={loading}>
          {loading ? <Spinner color="green"/> : <Play size={13} color="green" className="mr-1"/>}
          {loading ? "Optimizing..." : "Optimize"}
        </Button>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="default" size={"sm"} className="text-white text-sm">
              <SquareTerminal size={13} color="gray" className="mr-1"/>
              Output
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-zinc-900" style={{fontFamily:"'Robotomono',monospace"}}>
            <DrawerHeader className="w-full items-start">
              <DrawerTitle className="w-full flex items-center justify-start gap-3 text-lg font-semibold text-white">
                <SquareTerminal size={47} color="gray"/>
                <span className="text-3xl text-gray-300">Compilation Output</span>
              </DrawerTitle>
              <DrawerDescription className="text-base text-zinc-400 px-[61px]">stdout and stderr from g++ compilation and execution</DrawerDescription>
            </DrawerHeader>
            <pre className="mx-6 mb-4 p-4 rounded-[23px] bg-black text-green-400 text-sm font-mono min-h-[200px] max-h-[400px] overflow-auto no-scrollbar whitespace-pre-wrap shadow-[0px_1px_7px_0px_rgb(255,255,255)]">
              {compileOutput ||<div className="w-full flex flex-col items-center justify-start space-y-7 py-3">
              <SearchCode size={73} color="white"/>
              <p className="text-xl text-white text-center break-words" style={{fontFamily:"'Robotomono',monospace"}}>
              Compile code to see output
              </p>
              </div>}
            </pre>
            <DrawerFooter className="w-full flex items-start justify-start">
              <DrawerClose asChild>
                <Button variant="default" className="text-red-300 border border-[2px] border border-red-600 hover:cursor-pointer hover:bg-white hover:text-primary">
                  <X size={17} color="red"/>
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Button variant="default" className="text-white text-sm" size={"sm"} onClick={() => setIsHistoryOpen(true)}>
          <History size={17} color="orange" className="mr-1"/>
          History
        </Button>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-6">
            <div className="bg-zinc-900 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="flex-none p-6 gap-3 pb-4">
                <div className="flex items-center justify-start gap-3 mb-5">
                  <History size={34} color="orange"/>
                  <h2 className="text-2xl font-semibold text-white" style={{fontFamily:"'Robotomono',monospace"}}>Execution History</h2>
                </div>
                <p className="text-base text-zinc-400 flex items-center justify-start gap-3 ml-1"><span>Past executions and their outputs</span><CornerRightDown size={23} color="gray" className="mt-3"/></p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
                <pre className="p-4 bg-black text-sm font-mono rounded-lg border border-[0.3px] border border-white whitespace-pre-wrap h-full">
                  {history.length === 0
                    ? <span className="text-zinc-500">No history found.</span>
                    : history.map((run, i) => (
                        <span key={run.id}>
                          <span className="text-zinc-500">--- run {run.id} ---</span>{"\n"}
                          <span className="text-zinc-300">{run.code}</span>{"\n"}
                          <span className="text-green-400">{run.output || "(no output)"}</span>
                          {i < history.length - 1 && "\n\n"}
                        </span>
                      ))
                  }
                </pre>
              </div>
              <div className="flex-none py-5 px-[22px] pt-4">
                <Button variant="default" className="border border-[1px] border border-red-600 hover:cursor-pointer hover:text-red-600 hover:bg-white" onClick={() => setIsHistoryOpen(false)}>
                  <X size={17} color="red"/>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
        <Button variant="default" className="text-white text-sm" size={"sm"} onClick={(e) => { e.stopPropagation(); handlenavigate() }}>
          <GitBranch size={17} color="blue" className="mr-1"/>
          Dep Graph
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={"default"} className="text-white">
              <MoreHorizontal size={13} color="white"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent style={{fontFamily:"'Robotomono',monospace"}} className="min-w-[167px] bg-black mr-10">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Accessbility</DropdownMenuLabel>
              <DropdownMenuItem className="text-white"><Timer size={23} color="brown"/>History</DropdownMenuItem>
              <DropdownMenuItem className="text-white"><X size={23} color="red"/>Clear Editor</DropdownMenuItem>
              <DropdownMenuItem className="text-white"><CircleDot size={23} color="green"/>options...</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator/>
            <DropdownMenuGroup>
              <DropdownMenuLabel>System</DropdownMenuLabel>
              <DropdownMenuItem className="text-white"><User size={23} color="blue"/>Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-white"><RecycleIcon size={23} color="red"/>LogOut</DropdownMenuItem>
              <DropdownMenuItem className="text-white"><ArrowBigRight size={23} color="orange"/>Editor</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      <Separator/>
      <Editor
        height="100vh"
        defaultLanguage="cpp"
        theme="vs-dark"
        onMount={(ed:any) => { editorRef.current = ed }}
        defaultValue={`#include <stdio.h>

int main() {
    int shyam, ram, hello;
    int a = 5 + 3;
    int b = 10 + 20;
    shyam = 5;
    ram = 3;
    hello = shyam + ram;
    int c = a + b;
    return 0;
}
`}
        options={{
          fontSize: 15,
          minimap: { enabled: false },
          wordWrap: "on",
          automaticLayout: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          tabSize: 4,
        }}
      />

      {optimizerResult && (
        <div className="p-6 text-white">
          <Separator />
          <div className="text-lg font-semibold mt-4 mb-3 text-purple-300">Optimizer Analysis</div>

          <div className="mb-4">
            <div className="text-sm text-zinc-400 mb-1">IR Representation</div>
            <pre className="bg-zinc-900 p-3 rounded text-green-400 text-sm font-mono">
              {optimizerResult.ir.join("\n")}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-zinc-400 mb-1">Execution Batches</div>
              <pre className="bg-zinc-900 p-3 rounded text-sm font-mono">
                {optimizerResult.batches.map((b: number[], i: number) =>
                  `batch ${i}: [${optimizerResult.ir.filter((_: string, idx: number) => b.includes(idx)).join(", ")}]`
                ).join("\n")}
              </pre>
            </div>
            <div>
              <div className="text-sm text-zinc-400 mb-1">Performance</div>
              <div className="bg-zinc-900 p-3 rounded text-sm font-mono space-y-1">
                <div>sequential: {optimizerResult.sequential.time.toFixed(4)}s</div>
                <div>parallel:&nbsp;&nbsp; {optimizerResult.parallel.time.toFixed(4)}s</div>
                <div className="text-green-400 font-bold mt-1">
                  speedup: {(optimizerResult.sequential.time / optimizerResult.parallel.time).toFixed(2)}x
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-zinc-400 mb-1">Computed Values</div>
            <pre className="bg-zinc-900 p-3 rounded text-sm font-mono">
              {Object.entries(optimizerResult.sequential.results).map(([k, v]) => `${k} = ${v}`).join("\n")}
            </pre>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}
