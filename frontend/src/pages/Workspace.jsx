import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import CodeEditor from "@/components/CodeEditor";
import { api } from "@/lib/api";
import {
  Sparkles,
  Wrench,
  BookOpen,
  Bug,
  Zap,
  ClipboardList,
  Cpu as CpuIcon,
  Loader2,
  Copy,
  Download,
  Save,
  Plus,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const LANGUAGES = [
  "Arduino C++",
  "Embedded C",
  "MicroPython",
  "CircuitPython",
  "PlatformIO",
  "ESP-IDF",
];

const MODES = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "fix", label: "Fix", icon: Bug },
  { id: "optimize", label: "Optimize", icon: Zap },
  { id: "review", label: "Review", icon: Wrench },
  { id: "explain", label: "Explain", icon: BookOpen },
  { id: "wiring", label: "Wiring", icon: CpuIcon },
  { id: "bom", label: "BOM", icon: ClipboardList },
];

export default function Workspace() {
  const [params, setParams] = useSearchParams();
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState("arduino-uno");
  const [language, setLanguage] = useState("Arduino C++");
  const [framework, setFramework] = useState("");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("generate");
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [libraries, setLibraries] = useState([]);
  const [connections, setConnections] = useState([]);
  const [optimization, setOptimization] = useState("");

  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  // Load boards + projects, hydrate from ?template=slug or ?project=id
  useEffect(() => {
    api.get("/boards").then((r) => setBoards(r.data));
    api.get("/projects").then((r) => setProjects(r.data));

    const tSlug = params.get("template");
    const pId = params.get("project");
    if (tSlug) {
      api.get(`/templates/${tSlug}`).then((r) => {
        const t = r.data;
        setPrompt(t.prompt);
        setBoard(t.board);
        setLanguage(t.language);
        setProjectName(t.name);
        toast.success(`Loaded template: ${t.name}`);
      });
    }
    if (pId) {
      api.get(`/projects/${pId}`).then((r) => {
        const p = r.data;
        setProjectId(p.id);
        setProjectName(p.name);
        setBoard(p.board);
        setLanguage(p.language);
        setCode(p.code || "");
      });
    }
  }, []); // eslint-disable-line

  const boardObj = useMemo(
    () => boards.find((b) => b.slug === board),
    [boards, board]
  );

  const runGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe what you want to build.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/generate", {
        prompt,
        board,
        language,
        framework: framework || null,
        mode,
        project_id: projectId || null,
        existing_code: code || null,
      });
      setCode(data.code || code);
      setExplanation(data.explanation || "");
      setLibraries(data.libraries || []);
      setConnections(data.connections || []);
      setOptimization(data.optimization || "");
      toast.success(`${mode.toUpperCase()} complete — ${data.libraries?.length || 0} libraries suggested`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveAsProject = async () => {
    if (!projectName.trim()) {
      toast.error("Give the project a name first");
      return;
    }
    try {
      if (projectId) {
        await api.put(`/projects/${projectId}`, {
          name: projectName, code, board, language, framework: framework || null,
        });
        toast.success("Project saved");
      } else {
        const { data } = await api.post("/projects", {
          name: projectName, description: prompt.slice(0, 200),
          board, language, framework: framework || null,
        });
        await api.put(`/projects/${data.id}`, { code });
        setProjectId(data.id);
        setParams({ project: data.id });
        toast.success("Project created");
      }
      api.get("/projects").then((r) => setProjects(r.data));
    } catch (e) {
      toast.error("Save failed");
    }
  };

  const newSession = () => {
    setProjectId("");
    setProjectName("");
    setCode("");
    setPrompt("");
    setExplanation("");
    setLibraries([]);
    setConnections([]);
    setOptimization("");
    setParams({});
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const download = () => {
    const ext = language.toLowerCase().includes("python") ? "py"
      : language.toLowerCase().includes("c++") || language.toLowerCase().includes("arduino") ? "ino"
      : "c";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(projectName || "hrl-forge").replace(/\s/g, "-")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="h-screen flex flex-col">
        {/* Topbar */}
        <div className="h-14 border-b border-white/10 bg-[#050B14] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-yellow-500" />
            <div className="text-xs uppercase tracking-widest text-slate-500 font-mono">workspace</div>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Untitled project"
              className="h-8 bg-transparent border-0 focus-visible:ring-0 text-white font-medium max-w-xs"
              data-testid="project-name-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={newSession} data-testid="new-session-btn">
              <Plus className="w-4 h-4 mr-1" /> New
            </Button>
            <Select value={projectId || "new"} onValueChange={(v) => v !== "new" && (window.location.href = `/app/workspace?project=${v}`)}>
              <SelectTrigger className="h-8 w-56 bg-white/5 border-white/10 text-xs" data-testid="project-select">
                <SelectValue placeholder="Load project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">— Load project —</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={saveAsProject} className="border-white/10 bg-white/5" data-testid="save-project-btn">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Left: prompt + controls */}
          <div className="col-span-4 border-r border-white/10 overflow-y-auto p-5 space-y-4 bg-[#050B14]">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                Board
              </label>
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="bg-black/30 border-white/10 h-11" data-testid="board-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {boardObj && (
                <div className="mt-2 text-[11px] font-mono text-slate-500 flex flex-wrap gap-x-3">
                  <span>{boardObj.mcu}</span>
                  <span>· {boardObj.clock}</span>
                  <span>· {boardObj.flash} flash</span>
                  <span>· {boardObj.voltage}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-black/30 border-white/10 h-11" data-testid="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                Framework <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <Input
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                placeholder="e.g. FreeRTOS, PlatformIO, Arduino IDE"
                className="bg-black/30 border-white/10 h-11 font-mono text-sm"
                data-testid="framework-input"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                Prompt
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to build. Include sensors, target behaviour, timing, and any constraints…"
                rows={8}
                className="bg-black/30 border-white/10 font-mono text-sm placeholder:text-slate-600"
                data-testid="prompt-textarea"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    data-testid={`mode-${m.id}`}
                    className={`px-2 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border transition-colors flex items-center justify-center gap-1 ${
                      mode === m.id
                        ? "bg-yellow-500 text-[#050B14] border-yellow-500"
                        : "bg-white/[0.02] text-slate-400 border-white/10 hover:border-yellow-500/40 hover:text-white"
                    }`}
                  >
                    <m.icon className="w-3 h-3" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={runGenerate}
              disabled={loading}
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold text-base"
              data-testid="generate-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Forging…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> {mode === "generate" ? "Generate" : mode[0].toUpperCase() + mode.slice(1)} →
                </>
              )}
            </Button>
            <div className="text-[10px] text-slate-600 font-mono text-center">
              Powered by Claude Sonnet 4.6 · provider abstraction ready
            </div>
          </div>

          {/* Right: outputs */}
          <div className="col-span-8 overflow-hidden flex flex-col bg-[#030712]">
            <Tabs defaultValue="code" className="flex-1 flex flex-col">
              <TabsList className="rounded-none bg-[#050B14] border-b border-white/10 justify-start h-11 px-2">
                {[
                  ["code", "Code"],
                  ["explanation", "Explanation"],
                  ["libraries", "Libraries"],
                  ["connections", "Connections"],
                  ["optimization", "Optimization"],
                  ["download", "Download"],
                ].map(([v, l]) => (
                  <TabsTrigger
                    key={v}
                    value={v}
                    data-testid={`tab-${v}`}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-400 text-slate-500 rounded-none h-11 px-4 font-mono text-xs uppercase tracking-widest"
                  >
                    {l}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="code" className="m-0 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Button variant="outline" size="sm" onClick={copyCode} className="border-white/10 bg-white/5 h-8" data-testid="copy-code-btn">
                      <Copy className="w-3 h-3 mr-1.5" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={download} className="border-white/10 bg-white/5 h-8" data-testid="download-code-btn">
                      <Download className="w-3 h-3 mr-1.5" /> Download
                    </Button>
                  </div>
                  <CodeEditor value={code} onChange={setCode} language={language} height="calc(100vh - 250px)" />
                </TabsContent>

                <TabsContent value="explanation" className="m-0 p-6">
                  {explanation ? (
                    <Markdownish content={explanation} />
                  ) : (
                    <Empty label="Run a generation to see the engineering explanation." />
                  )}
                </TabsContent>

                <TabsContent value="libraries" className="m-0 p-6">
                  {libraries.length ? (
                    <div className="space-y-2">
                      {libraries.map((lib, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-md border border-white/10 bg-[#0A1325] font-mono text-sm flex items-center justify-between"
                          data-testid={`lib-item-${i}`}
                        >
                          <span className="text-white">{lib}</span>
                          <span className="text-[10px] text-yellow-500 uppercase tracking-widest">
                            required
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty label="No library suggestions yet — run a generation." />
                  )}
                </TabsContent>

                <TabsContent value="connections" className="m-0 p-6">
                  {connections.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-mono border-b border-white/10">
                            <th className="text-left py-3 px-3">Component</th>
                            <th className="text-left py-3 px-3">Component pin</th>
                            <th className="text-left py-3 px-3">Board pin</th>
                            <th className="text-left py-3 px-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {connections.map((c, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]" data-testid={`conn-row-${i}`}>
                              <td className="py-2.5 px-3 text-white">{c.component}</td>
                              <td className="py-2.5 px-3 font-mono text-yellow-400">{c.pin}</td>
                              <td className="py-2.5 px-3 font-mono text-yellow-400">{c.board_pin}</td>
                              <td className="py-2.5 px-3 text-slate-400">{c.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty label="No wiring diagram yet — try Mode: Wiring to generate one." />
                  )}
                </TabsContent>

                <TabsContent value="optimization" className="m-0 p-6">
                  {optimization ? <Markdownish content={optimization} /> : (
                    <Empty label="No optimization notes yet — run Mode: Optimize." />
                  )}
                </TabsContent>

                <TabsContent value="download" className="m-0 p-6">
                  <div className="max-w-md space-y-4">
                    <p className="text-slate-400 text-sm">
                      Download the generated code as a standalone file ready to open in
                      Arduino IDE, PlatformIO or Thonny.
                    </p>
                    <Button onClick={download} disabled={!code} className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11" data-testid="download-tab-btn">
                      <Download className="w-4 h-4 mr-2" /> Download source
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Empty({ label }) {
  return (
    <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-lg text-slate-500 text-sm font-mono">
      {label}
    </div>
  );
}

function Markdownish({ content }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <pre className="whitespace-pre-wrap font-body text-sm text-slate-300 leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
