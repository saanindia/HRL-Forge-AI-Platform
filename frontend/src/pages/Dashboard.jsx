import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  ArrowUpRight,
  FolderKanban,
  Sparkles,
  Terminal,
  BookMarked,
  Cpu,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/projects"),
      api.get("/history?limit=6"),
      api.get("/templates"),
    ])
      .then(([p, h, t]) => {
        setProjects(p.data);
        setHistory(h.data);
        setTemplates(t.data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: "Projects", value: projects.length, icon: FolderKanban, id: "stat-projects" },
    { label: "Generations", value: history.length, icon: Sparkles, id: "stat-generations" },
    { label: "Templates", value: templates.length, icon: BookMarked, id: "stat-templates" },
    { label: "Boards ready", value: 8, icon: Cpu, id: "stat-boards" },
  ];

  return (
    <AppShell>
      <div className="p-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">
              / dashboard
            </div>
            <h1 className="font-heading text-4xl font-bold mt-1" data-testid="dashboard-title">
              Welcome, {user?.name?.split(" ")[0]}.
            </h1>
            <p className="text-slate-400 mt-2">
              Continue your workbench — or start something new.
            </p>
          </div>
          <Link to="/app/workspace" data-testid="dashboard-new-btn">
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11 px-5">
              <Terminal className="w-4 h-4 mr-2" /> New generation
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              data-testid={s.id}
              className="p-5 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/30 transition-colors"
            >
              <s.icon className="w-4 h-4 text-yellow-500 mb-4" />
              <div className="font-heading text-3xl font-bold text-white">{s.value}</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent projects */}
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Recent projects</h2>
              <Link to="/app/projects" className="text-xs text-yellow-500 hover:text-yellow-400 font-mono uppercase tracking-widest" data-testid="dashboard-view-projects">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {projects.length === 0 && (
                <EmptyState
                  title="No projects yet"
                  hint="Head to the AI Workspace, describe what you want and hit Generate."
                  cta="/app/workspace"
                  ctaLabel="Open Workspace"
                />
              )}
              {projects.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/app/workspace?project=${p.id}`}
                  className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group"
                  data-testid={`project-row-${p.id}`}
                >
                  <div>
                    <div className="text-white font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500 mt-1 font-mono">
                      {p.board} · {p.language}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent history */}
          <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Recent activity
              </h2>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {history.length === 0 && (
                <div className="p-5 text-sm text-slate-500">No recent activity.</div>
              )}
              {history.map((h) => (
                <div key={h.id} className="p-4" data-testid={`history-row-${h.id}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {h.mode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {h.board}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {h.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured templates */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Featured templates
            </h2>
            <Link to="/app/templates" className="text-xs text-yellow-500 hover:text-yellow-400 font-mono uppercase tracking-widest" data-testid="dashboard-view-templates">
              Browse all →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((t) => (
              <Link
                key={t.id}
                to={`/app/workspace?template=${t.slug}`}
                className="p-5 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/40 hover:-translate-y-1 transition-transform"
                data-testid={`template-card-${t.slug}`}
              >
                <div className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-2">
                  {t.difficulty}
                </div>
                <div className="font-medium text-white">{t.name}</div>
                <div className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {t.description}
                </div>
                <div className="text-[10px] text-slate-600 mt-3 font-mono uppercase tracking-widest">
                  {t.board}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ title, hint, cta, ctaLabel }) {
  return (
    <div className="p-10 text-center">
      <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
        <Terminal className="w-6 h-6 text-yellow-500" />
      </div>
      <div className="font-heading text-lg font-semibold">{title}</div>
      <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">{hint}</p>
      <Link to={cta}>
        <Button className="mt-5 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}
