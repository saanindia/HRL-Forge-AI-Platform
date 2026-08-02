import React, { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CircuitBoard,
  Sparkles,
  Loader2,
  Copy,
  Download,
  Cpu as CpuIcon,
  Zap,
  Plug,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { PinDiagram } from "@/components/PinDiagram";
import { ComponentLibrary } from "@/components/ComponentLibrary";
import { Share2, Check } from "lucide-react";

const SUGGESTIONS = [
  "DHT22 temperature sensor + SSD1306 OLED display",
  "HC-SR04 ultrasonic + buzzer for parking sensor",
  "MPU6050 IMU + servo for self-balancing platform",
  "PIR motion sensor + relay to control a lamp",
  "L298N motor driver + 2 DC motors for a robot chassis",
];

export default function WiringGenerator() {
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState("arduino-uno");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [bom, setBom] = useState([]);
  const [notes, setNotes] = useState("");
  const [libraries, setLibraries] = useState([]);
  const [components, setComponents] = useState([]);
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);

  const addComponent = (c) => setComponents((prev) => [...prev, c]);
  const removeComponent = (slug) =>
    setComponents((prev) => prev.filter((c) => c.slug !== slug));

  // Auto-compose prompt when components change (only if user hasn't typed a custom one)
  useEffect(() => {
    if (!components.length) return;
    const list = components.map((c) => c.name).join(", ");
    setPrompt((prev) => {
      // If existing prompt clearly matches an older component set, replace it
      if (!prev || prev.startsWith("Wire up these components:")) {
        return `Wire up these components: ${list}. Provide pin mapping, wiring notes and BOM.`;
      }
      return prev;
    });
  }, [components]);

  useEffect(() => {
    api.get("/boards").then((r) => setBoards(r.data));
  }, []);

  const boardObj = useMemo(
    () => boards.find((b) => b.slug === board),
    [boards, board]
  );

  const generateWiring = async () => {
    if (!prompt.trim()) {
      toast.error("Describe the circuit you want to build first.");
      return;
    }
    setLoading(true);
    try {
      // First: wiring
      const { data: wiring } = await api.post("/generate", {
        prompt,
        board,
        language: "Arduino C++",
        mode: "wiring",
      });
      setConnections(wiring.connections || []);
      setNotes(wiring.explanation || "");
      setLibraries(wiring.libraries || []);

      // Second: BOM (parallel would be nicer, but keep it simple + informative)
      const { data: bomRes } = await api.post("/generate", {
        prompt,
        board,
        language: "Arduino C++",
        mode: "bom",
      });
      setBom(parseBom(bomRes));

      toast.success(
        `Wiring generated — ${wiring.connections?.length || 0} pin connections mapped`
      );
      setShareUrl(""); // invalidate previous share
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Wiring generation failed");
    } finally {
      setLoading(false);
    }
  };

  const shareWiring = async () => {
    if (!connections.length) {
      toast.error("Generate wiring first");
      return;
    }
    setSharing(true);
    try {
      const { data } = await api.post("/wiring/share", {
        prompt,
        board,
        board_name: boardObj?.name || board,
        connections,
        bom,
        libraries,
        notes,
      });
      const url = `${window.location.origin}/share/wiring/${data.token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast.success("Public link copied to clipboard");
    } catch (e) {
      toast.error("Failed to create share");
    } finally {
      setSharing(false);
    }
  };

  const copyMappings = () => {
    if (!connections.length) return;
    const text = connections
      .map((c) => `${c.component}\t${c.pin}\t${c.board_pin}\t${c.notes || ""}`)
      .join("\n");
    navigator.clipboard.writeText(
      "Component\tComponent Pin\tBoard Pin\tNotes\n" + text
    );
    toast.success("Pin mapping copied (TSV)");
  };

  const download = () => {
    if (!connections.length) return;
    const md = [
      `# Wiring — ${boardObj?.name || board}`,
      "",
      `**Prompt:** ${prompt}`,
      "",
      "## Pin Mapping",
      "| Component | Component Pin | Board Pin | Notes |",
      "|-----------|---------------|-----------|-------|",
      ...connections.map(
        (c) => `| ${c.component} | ${c.pin} | ${c.board_pin} | ${c.notes || ""} |`
      ),
      "",
      "## Libraries",
      ...libraries.map((l) => `- ${l}`),
      "",
      "## Bill of Materials",
      ...bom.map((b) => `- ${b.qty}× ${b.name} — ${b.notes || ""}`),
      "",
      "## Notes",
      notes,
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wiring-${board}.md`;
    a.click();
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">
              / wiring generator
            </div>
            <h1 className="font-heading text-4xl font-bold mt-1 flex items-center gap-3">
              <CircuitBoard className="w-8 h-8 text-yellow-500" />
              Wiring Generator
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Describe the circuit. Get pin-accurate wiring, a bill of materials, and a
              visual board diagram — ready to hand to a hardware engineer or breadboard
              build.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: input */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-5 rounded-xl border border-white/10 bg-[#0A1325] space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                  Target board
                </label>
                <Select value={board} onValueChange={setBoard}>
                  <SelectTrigger
                    className="bg-black/30 border-white/10 h-11"
                    data-testid="wiring-board-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((b) => (
                      <SelectItem key={b.slug} value={b.slug}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {boardObj && (
                  <div className="mt-2 text-[11px] font-mono text-slate-500 flex flex-wrap gap-x-3">
                    <span>{boardObj.mcu}</span>
                    <span>· {boardObj.voltage}</span>
                    <span>· {boardObj.gpio} GPIO</span>
                    <span className="text-yellow-500">
                      · {boardObj.interfaces?.slice(0, 3).join(" · ")}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-slate-500 font-mono mb-2 block">
                  Describe the circuit
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Connect a DHT22 on GPIO 4, an SSD1306 OLED on I2C, and a status LED on GPIO 13."
                  rows={5}
                  className="bg-black/30 border-white/10 font-mono text-sm placeholder:text-slate-600"
                  data-testid="wiring-prompt"
                />
              </div>

              <Button
                onClick={generateWiring}
                disabled={loading}
                className="w-full h-11 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold"
                data-testid="wiring-generate-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mapping pins…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate wiring →
                  </>
                )}
              </Button>
            </div>

            {/* Suggestion chips */}
            <div className="p-5 rounded-xl border border-white/10 bg-[#0A1325]">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-3">
                Quick starts
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    data-testid={`suggestion-${s.slice(0, 10)}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.02] text-slate-300 hover:border-yellow-500/40 hover:text-yellow-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Component library picker */}
            <ComponentLibrary
              selected={components}
              onAdd={addComponent}
              onRemove={removeComponent}
            />

            {/* Warnings / notes */}
            {boardObj && (
              <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.03] text-xs text-yellow-100 font-mono">
                <div className="uppercase tracking-widest text-yellow-500 mb-1 text-[10px]">
                  ⚠ Voltage guard
                </div>
                {boardObj.voltage.includes("3.3")
                  ? "This board is 3.3V logic — do NOT connect 5V sensor outputs directly. Use a level shifter."
                  : boardObj.voltage.includes("5V")
                  ? "This board is 5V logic — 3.3V sensor lines are typically safe as inputs, but check tolerance for outputs."
                  : "Mixed voltage board. Check datasheet before connecting peripherals."}
              </div>
            )}
          </div>

          {/* Right: output */}
          <div className="lg:col-span-7">
            {/* Share bar */}
            {connections.length > 0 && (
              <div className="mb-3 flex items-center justify-end gap-2">
                {shareUrl && (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-xs font-mono text-yellow-200"
                    data-testid="share-url-display"
                  >
                    <Check className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="truncate max-w-[260px]">{shareUrl}</span>
                  </div>
                )}
                <Button
                  onClick={shareWiring}
                  disabled={sharing}
                  variant="outline"
                  size="sm"
                  className="border-yellow-500/30 bg-yellow-500/5 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300 h-9"
                  data-testid="share-wiring-btn"
                >
                  {sharing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sharing…
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      {shareUrl ? "Regenerate share link" : "Share publicly"}
                    </>
                  )}
                </Button>
              </div>
            )}
            <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
              <Tabs defaultValue="diagram" className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-[#050B14] h-11 px-2">
                  {[
                    ["diagram", "Diagram", CircuitBoard],
                    ["mapping", "Pin Mapping", Plug],
                    ["bom", "Bill of Materials", ClipboardList],
                    ["notes", "Notes", CpuIcon],
                  ].map(([v, l, Icon]) => (
                    <TabsTrigger
                      key={v}
                      value={v}
                      data-testid={`wiring-tab-${v}`}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-400 text-slate-500 rounded-none h-11 px-4 font-mono text-xs uppercase tracking-widest gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5" /> {l}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="p-6 min-h-[500px]">
                  <TabsContent value="diagram" className="m-0">
                    {connections.length ? (
                      <PinDiagram
                        board={boardObj}
                        connections={connections}
                      />
                    ) : (
                      <Placeholder text="Run a generation to see a pin diagram." />
                    )}
                  </TabsContent>

                  <TabsContent value="mapping" className="m-0">
                    {connections.length ? (
                      <>
                        <div className="flex gap-2 mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={copyMappings}
                            className="border-white/10 bg-white/5 h-8"
                            data-testid="wiring-copy-btn"
                          >
                            <Copy className="w-3 h-3 mr-1.5" /> Copy as TSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={download}
                            className="border-white/10 bg-white/5 h-8"
                            data-testid="wiring-download-btn"
                          >
                            <Download className="w-3 h-3 mr-1.5" /> Download .md
                          </Button>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-white/10">
                          <table className="w-full text-sm">
                            <thead className="bg-white/[0.03]">
                              <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                                <th className="text-left py-3 px-4">#</th>
                                <th className="text-left py-3 px-4">Component</th>
                                <th className="text-left py-3 px-4">Component pin</th>
                                <th className="text-left py-3 px-4">Board pin</th>
                                <th className="text-left py-3 px-4">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {connections.map((c, i) => (
                                <tr
                                  key={i}
                                  className="hover:bg-white/[0.02]"
                                  data-testid={`wiring-row-${i}`}
                                >
                                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                                    {String(i + 1).padStart(2, "0")}
                                  </td>
                                  <td className="py-3 px-4 text-white">{c.component}</td>
                                  <td className="py-3 px-4 font-mono text-yellow-400">
                                    {c.pin}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                      <Zap className="w-3 h-3" />
                                      {c.board_pin}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-400 text-xs">
                                    {c.notes}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <Placeholder text="Pin mapping will appear here." />
                    )}
                  </TabsContent>

                  <TabsContent value="bom" className="m-0">
                    {bom.length ? (
                      <div className="space-y-2">
                        {bom.map((b, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-lg border border-white/10 bg-black/20 flex items-center gap-4"
                            data-testid={`bom-row-${i}`}
                          >
                            <div className="w-10 h-10 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold">
                              {b.qty}×
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium">{b.name}</div>
                              {b.notes && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {b.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Placeholder text="Bill of materials will appear here after generation." />
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="m-0">
                    {notes ? (
                      <div className="space-y-4">
                        <pre className="whitespace-pre-wrap font-body text-sm text-slate-300 leading-relaxed">
                          {notes}
                        </pre>
                        {libraries.length > 0 && (
                          <div className="pt-4 border-t border-white/10">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
                              Firmware libraries
                            </div>
                            <ul className="space-y-1 text-sm font-mono text-slate-300">
                              {libraries.map((l, i) => (
                                <li key={i}>· {l}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Placeholder text="Engineering notes will appear here." />
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Placeholder({ text }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 border border-dashed border-white/10 rounded-lg text-slate-500 font-mono text-sm">
      <CircuitBoard className="w-8 h-8 text-slate-700 mb-3" />
      {text}
    </div>
  );
}

// Best-effort parse of BOM response. The AI returns everything in the JSON envelope;
// BOM typically ends up either in `explanation` as markdown or occasionally as
// structured items via `connections`. Handle both.
function parseBom(res) {
  const items = [];
  // 1) Try libraries field (LLM sometimes puts BOM under connections)
  if (Array.isArray(res.connections) && res.connections.length) {
    for (const c of res.connections) {
      if (c.component) {
        items.push({
          qty: c.qty || 1,
          name: c.component,
          notes: c.notes || "",
        });
      }
    }
    if (items.length) return items;
  }
  // 2) Parse markdown table / list from explanation
  const text = res.explanation || res.optimization || "";
  const lines = text.split("\n");
  for (const line of lines) {
    const l = line.trim();
    // markdown table row: | Qty | Name | Notes |
    const table = l.match(/^\|\s*(\d+)\s*[x×]?\s*\|\s*([^|]+?)\s*\|\s*([^|]*)\|/i);
    if (table) {
      items.push({ qty: parseInt(table[1], 10), name: table[2].trim(), notes: table[3].trim() });
      continue;
    }
    // bullet: - 2x Servo motor SG90
    const bullet = l.match(/^[-*]\s*(\d+)\s*[x×]\s*(.+?)(?:\s*[-—]\s*(.+))?$/i);
    if (bullet) {
      items.push({
        qty: parseInt(bullet[1], 10),
        name: bullet[2].trim(),
        notes: (bullet[3] || "").trim(),
      });
    }
  }
  return items;
}
