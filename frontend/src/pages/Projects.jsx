import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Plus, FolderKanban } from "lucide-react";
import { toast } from "sonner";

export default function Projects() {
  const [projects, setProjects] = useState([]);

  const load = () => api.get("/projects").then((r) => setProjects(r.data));

  useEffect(() => { load(); }, []);

  const clone = async (id) => {
    await api.post(`/projects/${id}/clone`);
    toast.success("Project cloned");
    load();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    await api.delete(`/projects/${id}`);
    toast.success("Project deleted");
    load();
  };

  return (
    <AppShell>
      <div className="p-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ projects</div>
            <h1 className="font-heading text-4xl font-bold mt-1">Your projects</h1>
          </div>
          <Link to="/app/workspace" data-testid="projects-new-btn">
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold">
              <Plus className="w-4 h-4 mr-2" /> New project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/10 rounded-xl bg-[#0A1325]">
            <FolderKanban className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
            <div className="font-heading text-xl">No projects yet</div>
            <p className="text-slate-400 text-sm mt-2">
              Head to the workspace to forge your first one.
            </p>
            <Link to="/app/workspace">
              <Button className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold">
                Open Workspace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/40 transition-colors group"
                data-testid={`project-card-${p.id}`}
              >
                <Link to={`/app/workspace?project=${p.id}`} className="block">
                  <div className="font-heading text-lg font-semibold text-white">
                    {p.name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
                    {p.board} · {p.language}
                  </div>
                  <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                    {p.description || "No description"}
                  </p>
                </Link>
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-slate-600 font-mono">
                    Updated {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => clone(p.id)} data-testid={`clone-${p.id}`}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400 hover:bg-red-500/10" onClick={() => remove(p.id)} data-testid={`delete-${p.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
