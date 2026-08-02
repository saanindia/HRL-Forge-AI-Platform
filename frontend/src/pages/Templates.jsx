import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => { api.get("/templates").then((r) => setTemplates(r.data)); }, []);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q.toLowerCase()) ||
      t.description.toLowerCase().includes(q.toLowerCase()) ||
      t.tags?.some((tag) => tag.includes(q.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ templates</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Template library</h1>
          <p className="text-slate-400 mt-2">Curated starting points — click to load into the workspace.</p>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search templates…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10 h-11 bg-black/30 border-white/10"
            data-testid="templates-search"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/app/workspace?template=${t.slug}`}
              className="p-6 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/40 hover:-translate-y-1 transition-transform group"
              data-testid={`template-${t.slug}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                  {t.difficulty}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="font-heading text-lg font-semibold text-white">{t.name}</div>
              <p className="text-sm text-slate-400 mt-2 line-clamp-3">{t.description}</p>
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {t.tags?.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-mono uppercase tracking-widest text-slate-600">
                {t.board} · {t.language}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
