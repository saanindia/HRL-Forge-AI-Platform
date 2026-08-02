import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import {
  FolderKanban,
  BookMarked,
  Cpu,
  Clock,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";

/**
 * Global search palette — Cmd+K / Ctrl+K to open. Searches projects,
 * templates, boards and history in a single call and lets the user
 * navigate to any hit with the keyboard or mouse.
 */
export function SearchPalette({ open, onOpenChange }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const nav = useNavigate();
  const timer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setResults(data);
        setCursor(0);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(timer.current);
  }, [q, open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setResults(null);
      setCursor(0);
    }
  }, [open]);

  const flatItems = flatten(results);

  const go = useCallback(
    (item) => {
      if (!item) return;
      onOpenChange(false);
      nav(item.to);
    },
    [nav, onOpenChange]
  );

  const onKeyDown = (e) => {
    if (!flatItems.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flatItems[cursor]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 bg-[#0A1325] border-white/10 gap-0 overflow-hidden"
        data-testid="search-palette"
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search projects, templates, boards and history
        </DialogDescription>
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/10">
          {loading ? (
            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-500" />
          )}
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, templates, boards, history…"
            className="border-0 bg-transparent focus-visible:ring-0 h-11 text-sm font-mono placeholder:text-slate-600"
            data-testid="search-palette-input"
          />
          <kbd className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-slate-500 px-1.5 py-0.5 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2">
          {!q.trim() && (
            <EmptyHint />
          )}
          {q.trim() && !loading && flatItems.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-mono text-sm">
              No results for “{q}”
            </div>
          )}

          {results && flatItems.length > 0 && (
            <>
              {["projects", "templates", "boards", "history"].map((group) => {
                const items = flatItems.filter((i) => i.group === group);
                if (!items.length) return null;
                return (
                  <div key={group} className="mb-2">
                    <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                      {group}
                    </div>
                    {items.map((item) => {
                      const idx = flatItems.indexOf(item);
                      const active = cursor === idx;
                      return (
                        <button
                          key={item.key}
                          onClick={() => go(item)}
                          onMouseEnter={() => setCursor(idx)}
                          data-testid={`search-result-${item.group}-${item.key}`}
                          className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                            active
                              ? "bg-yellow-500/10 text-yellow-100"
                              : "text-slate-300 hover:bg-white/[0.03]"
                          }`}
                        >
                          <item.Icon
                            className={`w-4 h-4 shrink-0 ${
                              active ? "text-yellow-400" : "text-slate-500"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{item.title}</div>
                            {item.subtitle && (
                              <div className="text-[11px] font-mono text-slate-500 truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 ${
                              active ? "text-yellow-400" : "text-slate-600"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="px-4 h-9 border-t border-white/10 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <span>
            <kbd className="px-1 border border-white/10 rounded">↑</kbd>{" "}
            <kbd className="px-1 border border-white/10 rounded">↓</kbd> navigate ·{" "}
            <kbd className="px-1 border border-white/10 rounded">↵</kbd> open
          </span>
          <span>HRL Forge · search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyHint() {
  return (
    <div className="p-8 text-center">
      <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3">
        <Search className="w-4 h-4 text-yellow-500" />
      </div>
      <div className="text-sm text-slate-300">Search everything</div>
      <div className="text-xs text-slate-500 mt-1 font-mono">
        projects · templates · boards · history
      </div>
    </div>
  );
}

function flatten(res) {
  if (!res) return [];
  const out = [];
  (res.projects || []).forEach((p) =>
    out.push({
      key: p.id,
      group: "projects",
      Icon: FolderKanban,
      title: p.name,
      subtitle: `${p.board} · ${p.language}`,
      to: `/app/workspace?project=${p.id}`,
    })
  );
  (res.templates || []).forEach((t) =>
    out.push({
      key: t.slug,
      group: "templates",
      Icon: BookMarked,
      title: t.name,
      subtitle: `${t.difficulty} · ${t.board} · ${t.language}`,
      to: `/app/workspace?template=${t.slug}`,
    })
  );
  (res.boards || []).forEach((b) =>
    out.push({
      key: b.slug,
      group: "boards",
      Icon: Cpu,
      title: b.name,
      subtitle: `${b.mcu} · ${b.family}`,
      to: `/app/boards`,
    })
  );
  (res.history || []).forEach((h) =>
    out.push({
      key: h.id,
      group: "history",
      Icon: Clock,
      title: h.prompt.slice(0, 80),
      subtitle: `${h.mode} · ${h.board}`,
      to: `/app/history`,
    })
  );
  return out;
}
