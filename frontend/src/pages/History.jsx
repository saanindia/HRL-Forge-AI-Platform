import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function History() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = () => api.get("/history?limit=100").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this history entry?")) return;
    await api.delete(`/history/${id}`);
    toast.success("Deleted");
    if (selected?.id === id) setSelected(null);
    load();
  };

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ history</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Generation history</h1>
          <p className="text-slate-400 mt-2">Every prompt, every response — searchable and re-runnable.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden max-h-[70vh] overflow-y-auto">
            {items.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">No history yet.</div>
            )}
            {items.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                data-testid={`history-item-${h.id}`}
                className={`w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors ${
                  selected?.id === h.id ? "bg-yellow-500/5 border-l-2 border-l-yellow-500" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    {h.mode}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{h.board}</span>
                  <span className="text-[10px] text-slate-600 font-mono ml-auto">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-300 line-clamp-2">{h.prompt}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7">
            {selected ? (
              <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
                <div className="p-5 border-b border-white/10 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-yellow-500 font-mono">
                      {selected.mode} · {selected.board} · {selected.language}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{selected.prompt}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(selected.id)} className="hover:text-red-400 hover:bg-red-500/10" data-testid="delete-history-btn">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-5 space-y-6 max-h-[55vh] overflow-y-auto">
                  {selected.explanation && (
                    <Section title="Explanation">
                      <pre className="whitespace-pre-wrap text-sm text-slate-300 font-body">{selected.explanation}</pre>
                    </Section>
                  )}
                  {selected.code && (
                    <Section title="Code">
                      <pre className="p-4 rounded-md bg-black/40 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto">
                        {selected.code}
                      </pre>
                    </Section>
                  )}
                  {selected.libraries?.length > 0 && (
                    <Section title="Libraries">
                      <ul className="space-y-1 text-sm text-slate-300 font-mono">
                        {selected.libraries.map((l, i) => <li key={i}>· {l}</li>)}
                      </ul>
                    </Section>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 h-96 flex items-center justify-center text-slate-500 text-sm">
                Select an entry to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const Section = ({ title, children }) => (
  <div>
    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">{title}</div>
    {children}
  </div>
);
