import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [providers, setProviders] = useState({ active: [], future: [] });

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data));
    api.get("/generate/providers").then((r) => setProviders(r.data));
  }, []);

  const save = async () => {
    const { data } = await api.put("/settings", settings);
    setSettings(data);
    toast.success("Settings saved");
  };

  if (!settings) return <AppShell><div className="p-8 text-slate-500 font-mono text-sm">Loading…</div></AppShell>;

  const activeProvider = providers.active.find((p) => p.id === settings.default_provider);

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ settings</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Settings</h1>
          <p className="text-slate-400 mt-2">Configure the AI provider, model and integration keys.</p>
        </div>

        {/* Provider */}
        <Panel title="AI Provider" subtitle="OpenRouter with Claude Sonnet 4.5 by default. Change anytime.">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={settings.default_provider} onValueChange={(v) => setSettings({ ...settings, default_provider: v })}>
                <SelectTrigger className="bg-black/30 border-white/10 h-11" data-testid="provider-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.active.map((p) => <SelectItem key={p.id} value={p.id}>{p.id}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={settings.default_model} onValueChange={(v) => setSettings({ ...settings, default_model: v })}>
                <SelectTrigger className="bg-black/30 border-white/10 h-11" data-testid="model-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeProvider?.models?.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>

        {/* Future providers */}
        <Panel title="External Provider Keys" subtitle="Optional — plug your own keys for OpenRouter, Groq or HuggingFace.">
          <div className="space-y-4">
            {[
              ["openrouter_key", "OpenRouter API Key"],
              ["groq_key", "Groq API Key"],
              ["huggingface_key", "HuggingFace API Key"],
              ["gemini_key", "Gemini API Key (bring-your-own)"],
            ].map(([k, l]) => (
              <div key={k} className="space-y-2">
                <Label className="flex items-center gap-2 text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-yellow-500" /> {l}
                </Label>
                <Input
                  type="password"
                  value={settings[k] || ""}
                  onChange={(e) => setSettings({ ...settings, [k]: e.target.value })}
                  placeholder="sk-…"
                  className="bg-black/30 border-white/10 h-11 font-mono text-sm"
                  data-testid={`input-${k}`}
                />
              </div>
            ))}
            <p className="text-[11px] text-slate-500 font-mono">
              These are stored encrypted per-user. Only used when you select the matching provider.
            </p>
          </div>
        </Panel>

        <div className="flex justify-end">
          <Button onClick={save} className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11 px-6" data-testid="settings-save-btn">
            <Save className="w-4 h-4 mr-2" /> Save settings
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

const Panel = ({ title, subtitle, children }) => (
  <div className="mb-6 p-6 rounded-xl border border-white/10 bg-[#0A1325]">
    <h2 className="font-heading text-lg font-semibold">{title}</h2>
    {subtitle && <p className="text-sm text-slate-400 mt-1 mb-4">{subtitle}</p>}
    {children}
  </div>
);
