import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { ShieldAlert, Users, FolderKanban, Sparkles, MessageSquare, BookMarked } from "lucide-react";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/admin/stats"), api.get("/admin/users")])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data); })
      .catch((e) => setError(e?.response?.data?.detail || "Access denied"));
  }, []);

  if (error) {
    return (
      <AppShell>
        <div className="p-8 max-w-md">
          <div className="p-8 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
            <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <div className="font-heading text-xl">Restricted</div>
            <p className="text-sm text-slate-400 mt-2">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const cards = stats ? [
    { icon: Users, label: "Users", value: stats.users },
    { icon: FolderKanban, label: "Projects", value: stats.projects },
    { icon: Sparkles, label: "Generations", value: stats.generations },
    { icon: MessageSquare, label: "Chat messages", value: stats.chat_messages },
    { icon: BookMarked, label: "Templates", value: stats.templates },
  ] : [];

  return (
    <AppShell>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ admin</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Admin console</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="p-5 rounded-xl border border-white/10 bg-[#0A1325]">
              <c.icon className="w-4 h-4 text-yellow-500 mb-3" />
              <div className="font-heading text-3xl font-bold">{c.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-heading text-lg font-semibold">Users</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-mono border-b border-white/5">
                <th className="text-left px-5 py-3">Name</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]" data-testid={`admin-user-${u.id}`}>
                  <td className="px-5 py-3 text-white">{u.name}</td>
                  <td className="px-5 py-3 text-slate-400 font-mono text-sm">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
