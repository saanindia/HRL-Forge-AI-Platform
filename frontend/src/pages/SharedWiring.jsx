import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Logo } from "@/components/Logo";
import { PinDiagram } from "@/components/PinDiagram";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CircuitBoard,
  Plug,
  ClipboardList,
  Cpu as CpuIcon,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/** Public shared-wiring page — no auth required. */
export default function SharedWiring() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/v1/wiring/share/${token}`)
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(e?.response?.status === 404 ? "This share does not exist or was revoked." : "Failed to load")
      );
  }, [token]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Logo className="justify-center mb-6" />
          <div className="font-heading text-2xl font-bold text-white">
            Share not found
          </div>
          <p className="text-slate-400 mt-2 text-sm">{error}</p>
          <Link to="/">
            <Button className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold">
              Go home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-slate-500 font-mono text-sm">
        Loading…
      </div>
    );
  }

  const boardObj = {
    slug: data.board,
    name: data.board_name || data.board,
    mcu: "—",
    voltage: "—",
    gpio: 20,
    interfaces: [],
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white">
      {/* Public header */}
      <header className="border-b border-white/5 bg-[#050B14]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
            <Eye className="w-3.5 h-3.5" />
            <span data-testid="share-view-count">{data.view_count} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="border-white/10 bg-white/5 h-9"
              data-testid="share-copy-link-btn"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy link
            </Button>
            <Link to="/register">
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-9">
                Build your own
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">
            / shared wiring
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold mt-1" data-testid="share-title">
            {data.board_name || data.board}
          </h1>
          <p className="text-slate-400 mt-2 max-w-3xl">{data.prompt}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0A1325] overflow-hidden">
          <Tabs defaultValue="diagram">
            <TabsList className="w-full justify-start rounded-none border-b border-white/10 bg-[#050B14] h-11 px-2">
              {[
                ["diagram", "Diagram", CircuitBoard],
                ["mapping", "Pin Mapping", Plug],
                ["bom", "Bill of Materials", ClipboardList],
                ["notes", "Notes", CpuIcon],
              ].map(([v, l, Icon]) => (
                <TabsTrigger
                  key={v}
                  value={v}
                  data-testid={`share-tab-${v}`}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-400 text-slate-500 rounded-none h-11 px-4 font-mono text-xs uppercase tracking-widest gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" /> {l}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="p-6 min-h-[500px]">
              <TabsContent value="diagram" className="m-0">
                <PinDiagram board={boardObj} connections={data.connections || []} />
              </TabsContent>

              <TabsContent value="mapping" className="m-0">
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/[0.03]">
                      <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                        <th className="text-left py-3 px-4">Component</th>
                        <th className="text-left py-3 px-4">Component pin</th>
                        <th className="text-left py-3 px-4">Board pin</th>
                        <th className="text-left py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(data.connections || []).map((c, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4 text-white">{c.component}</td>
                          <td className="py-3 px-4 font-mono text-yellow-400">{c.pin}</td>
                          <td className="py-3 px-4 font-mono text-yellow-400">
                            {c.board_pin}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="bom" className="m-0">
                <div className="space-y-2">
                  {(data.bom || []).map((b, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-white/10 bg-black/20 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-md bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 font-mono text-sm font-bold">
                        {b.qty}×
                      </div>
                      <div>
                        <div className="text-white font-medium">{b.name}</div>
                        {b.notes && (
                          <div className="text-xs text-slate-500 mt-0.5">{b.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="m-0">
                <pre className="whitespace-pre-wrap font-body text-sm text-slate-300 leading-relaxed">
                  {data.notes}
                </pre>
                {data.libraries?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-2">
                      Firmware libraries
                    </div>
                    <ul className="space-y-1 text-sm font-mono text-slate-300">
                      {data.libraries.map((l, i) => (
                        <li key={i}>· {l}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="mt-10 text-center text-xs text-slate-500 font-mono">
          Built with HRL Forge AI · forge.myhrl.in
        </div>
      </main>
    </div>
  );
}
