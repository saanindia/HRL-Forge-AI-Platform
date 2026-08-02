import React, { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Send, Loader2, Cpu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function Assistant() {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem("hrl_chat_session") || uuid());
  const [context, setContext] = useState("circuit");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("hrl_chat_session", sessionId);
    api.get(`/chat/session/${sessionId}`).then((r) => setMessages(r.data)).catch(() => {});
  }, [sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    const userMsg = { id: uuid(), role: "user", content: text, context };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const { data } = await api.post("/chat/message", { session_id: sessionId, message: text, context });
      setMessages((m) => [...m, data]);
    } catch (e) {
      toast.error("Chat failed");
    } finally {
      setSending(false);
    }
  };

  const newSession = () => {
    const id = uuid();
    setSessionId(id);
    setMessages([]);
  };

  return (
    <AppShell>
      <div className="h-screen flex flex-col">
        <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-[#050B14]">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-widest text-slate-500 font-mono">/ assistant</div>
            <div className="flex bg-white/[0.03] rounded-md border border-white/10 p-0.5">
              <button
                onClick={() => setContext("circuit")}
                data-testid="ctx-circuit"
                className={`px-3 py-1 text-xs font-mono uppercase tracking-widest rounded flex items-center gap-1.5 ${
                  context === "circuit" ? "bg-yellow-500 text-[#050B14]" : "text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="w-3 h-3" /> Circuit
              </button>
              <button
                onClick={() => setContext("datasheet")}
                data-testid="ctx-datasheet"
                className={`px-3 py-1 text-xs font-mono uppercase tracking-widest rounded flex items-center gap-1.5 ${
                  context === "datasheet" ? "bg-yellow-500 text-[#050B14]" : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3 h-3" /> Datasheet
              </button>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={newSession} data-testid="new-chat-btn">
            + New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.length === 0 && (
            <div className="max-w-md mx-auto text-center py-24">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                {context === "circuit" ? <Cpu className="w-6 h-6 text-yellow-500" /> : <FileText className="w-6 h-6 text-yellow-500" />}
              </div>
              <div className="font-heading text-xl font-semibold">
                {context === "circuit" ? "Circuit Assistant" : "Datasheet Assistant"}
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {context === "circuit"
                  ? "Design circuits, debug wiring, ask about voltage levels or current limits."
                  : "Explain datasheets, register maps, timing diagrams. Feed a component and go deep."}
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} data-testid={`msg-${m.role}`} className={`max-w-3xl ${m.role === "user" ? "ml-auto" : ""}`}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1.5">
                {m.role === "user" ? "You" : "HRL Forge AI"}
              </div>
              <div
                className={`p-4 rounded-lg ${
                  m.role === "user"
                    ? "bg-yellow-500/10 border border-yellow-500/20 text-white"
                    : "bg-[#0A1325] border border-white/10 text-slate-300"
                }`}
              >
                <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed">{m.content}</pre>
              </div>
            </div>
          ))}
          {sending && (
            <div className="max-w-3xl">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1.5">HRL Forge AI</div>
              <div className="p-4 rounded-lg bg-[#0A1325] border border-white/10 text-slate-400 flex items-center gap-2 text-sm font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-yellow-500" /> Analysing…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-4 bg-[#050B14]">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={context === "circuit" ? "e.g. How do I level-shift 5V I2C down to 3.3V?" : "e.g. Explain the CTRL_REG1 register of the MPU6050."}
              rows={2}
              className="bg-black/30 border-white/10 font-body resize-none"
              data-testid="chat-input"
            />
            <Button onClick={send} disabled={sending || !input.trim()} className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-auto px-5" data-testid="chat-send-btn">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
