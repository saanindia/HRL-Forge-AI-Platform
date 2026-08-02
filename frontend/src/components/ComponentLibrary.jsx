import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Cpu, Puzzle } from "lucide-react";

/**
 * Component picker — click sensors / modules to add them to the current
 * wiring prompt. Also renders the running list of selected components with
 * remove buttons.
 */
export function ComponentLibrary({ selected, onAdd, onRemove }) {
  const [sensors, setSensors] = useState([]);
  const [modules, setModules] = useState([]);
  const [tab, setTab] = useState("sensors");
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([api.get("/sensors"), api.get("/modules")]).then(([s, m]) => {
      setSensors(s.data);
      setModules(m.data);
    });
  }, []);

  const items = tab === "sensors" ? sensors : modules;
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.name.toLowerCase().includes(q.toLowerCase()) ||
          (i.category || "").toLowerCase().includes(q.toLowerCase())
      ),
    [items, q]
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4 text-yellow-500" />
          <span className="font-heading font-semibold text-sm">Component library</span>
        </div>
        <div className="flex bg-white/[0.03] rounded-md border border-white/10 p-0.5 text-[10px] font-mono uppercase tracking-widest">
          <button
            onClick={() => setTab("sensors")}
            data-testid="lib-tab-sensors"
            className={`px-2 py-0.5 rounded ${
              tab === "sensors" ? "bg-yellow-500 text-[#050B14]" : "text-slate-500"
            }`}
          >
            Sensors
          </button>
          <button
            onClick={() => setTab("modules")}
            data-testid="lib-tab-modules"
            className={`px-2 py-0.5 rounded ${
              tab === "modules" ? "bg-yellow-500 text-[#050B14]" : "text-slate-500"
            }`}
          >
            Modules
          </button>
        </div>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10 bg-black/20">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
            In this circuit ({selected.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((c) => (
              <span
                key={c.slug}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-100"
                data-testid={`selected-${c.slug}`}
              >
                {c.name}
                <button
                  onClick={() => onRemove(c.slug)}
                  className="w-4 h-4 rounded-full hover:bg-yellow-500/20 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="pl-8 h-9 bg-black/30 border-white/10 text-sm"
            data-testid="lib-search"
          />
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto px-3 pb-3 space-y-1">
        {filtered.map((i) => {
          const isSelected = selected.some((s) => s.slug === i.slug);
          return (
            <button
              key={i.slug}
              onClick={() => !isSelected && onAdd(i)}
              disabled={isSelected}
              data-testid={`lib-item-${i.slug}`}
              className={`w-full text-left px-3 py-2 rounded-md border transition-colors flex items-center justify-between group ${
                isSelected
                  ? "bg-yellow-500/5 border-yellow-500/30 text-slate-500 cursor-default"
                  : "bg-white/[0.02] border-white/5 hover:border-yellow-500/40 hover:bg-white/[0.04]"
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm text-white truncate">{i.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">
                  {i.category}
                  {i.protocol ? ` · ${i.protocol}` : ""}
                </div>
              </div>
              {isSelected ? (
                <span className="text-[10px] text-yellow-400 font-mono">added</span>
              ) : (
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-yellow-400" />
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-slate-600 font-mono text-xs py-6">
            No matches
          </div>
        )}
      </div>
    </div>
  );
}
