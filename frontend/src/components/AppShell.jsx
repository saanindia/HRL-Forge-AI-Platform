import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Terminal,
  BookMarked,
  Cpu,
  History,
  Settings,
  BookOpen,
  ShieldCheck,
  LogOut,
  MessageSquareCode,
  CircuitBoard,
  Search,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { SearchPalette } from "@/components/SearchPalette";

const NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { to: "/app/workspace", label: "AI Workspace", icon: Terminal, id: "workspace" },
  { to: "/app/wiring", label: "Wiring Generator", icon: CircuitBoard, id: "wiring" },
  { to: "/app/projects", label: "Projects", icon: FolderKanban, id: "projects" },
  { to: "/app/templates", label: "Templates", icon: BookMarked, id: "templates" },
  { to: "/app/boards", label: "Boards", icon: Cpu, id: "boards" },
  { to: "/app/assistant", label: "Circuit Assistant", icon: MessageSquareCode, id: "assistant" },
  { to: "/app/history", label: "History", icon: History, id: "history" },
  { to: "/app/settings", label: "Settings", icon: Settings, id: "settings" },
  { to: "/app/docs", label: "Documentation", icon: BookOpen, id: "docs" },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className="min-h-screen flex bg-[#050B14]">
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 border-r border-white/10 bg-[#050B14]/95 backdrop-blur-xl flex flex-col fixed h-screen z-30"
        data-testid="sidebar"
      >
        <div className="h-14 border-b border-white/10 flex items-center px-4 gap-2">
          <Logo />
        </div>

        {/* Search trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={() => setSearchOpen(true)}
            data-testid="search-trigger"
            className="w-full flex items-center gap-2 px-3 h-9 rounded-md border border-white/10 bg-white/[0.02] hover:border-yellow-500/40 hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 transition-colors group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search…</span>
            <kbd className="ml-auto text-[9px] font-mono uppercase tracking-widest text-slate-600 px-1.5 py-0.5 border border-white/10 rounded group-hover:text-slate-400">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.id}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              <span className="font-medium">{n.label}</span>
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <NavLink
              to="/app/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mt-4 border-t border-white/5 pt-4 ${
                  isActive
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-md bg-white/[0.03]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 flex items-center justify-center text-[#050B14] font-bold text-sm">
              {(user?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate" data-testid="user-name">
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 min-h-screen">{children}</main>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
