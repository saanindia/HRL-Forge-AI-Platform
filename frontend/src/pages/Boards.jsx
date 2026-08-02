import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Cpu, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Boards() {
  const [boards, setBoards] = useState([]);
  useEffect(() => { api.get("/boards").then((r) => setBoards(r.data)); }, []);

  return (
    <AppShell>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ boards</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Supported boards</h1>
          <p className="text-slate-400 mt-2">Every board HRL Forge speaks — MCU, clock, memory and interfaces.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {boards.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/40 transition-colors"
              data-testid={`board-${b.slug}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-3">
                    <Cpu className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="font-heading text-xl font-semibold text-white">{b.name}</div>
                  <div className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">
                    {b.family}
                  </div>
                </div>
                <Link to={`/app/workspace?board=${b.slug}`} data-testid={`board-code-${b.slug}`}>
                  <Button variant="outline" size="sm" className="border-white/10 bg-white/5">
                    <Terminal className="w-3.5 h-3.5 mr-1" /> Code
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-4">{b.description}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                <Row k="MCU" v={b.mcu} />
                <Row k="Clock" v={b.clock} />
                <Row k="Flash" v={b.flash} />
                <Row k="RAM" v={b.ram} />
                <Row k="GPIO" v={b.gpio} />
                <Row k="Voltage" v={b.voltage} />
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {b.interfaces?.map((i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

const Row = ({ k, v }) => (
  <>
    <dt className="text-slate-500 uppercase tracking-widest">{k}</dt>
    <dd className="text-white">{v}</dd>
  </>
);
