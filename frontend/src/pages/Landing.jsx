import React from "react";
import { Link } from "react-router-dom";
import {
  Cpu,
  CircuitBoard,
  Zap,
  Terminal,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  Github,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { HRL_LOGO } from "@/lib/api";

const BOARDS = [
  "Arduino Uno",
  "Arduino Nano",
  "Arduino Mega",
  "ESP32",
  "ESP8266",
  "STM32",
  "ATmega328P",
  "Raspberry Pi Pico",
];

const LANGS = [
  "Arduino C++",
  "Embedded C",
  "MicroPython",
  "CircuitPython",
  "PlatformIO",
  "ESP-IDF",
];

const FEATURES = [
  {
    icon: Terminal,
    title: "AI Workspace",
    body: "A VS Code-style workspace with Monaco editor, prompt panel and pin-accurate output tabs — code, explanation, libraries, wiring, optimization.",
  },
  {
    icon: CircuitBoard,
    title: "Board-aware generation",
    body: "Generate compilable firmware targeting the exact MCU. HRL Forge knows about clock speeds, GPIO, voltage levels and interfaces.",
  },
  {
    icon: Layers,
    title: "Provider abstraction",
    body: "Claude Sonnet, GPT-5 and Gemini out of the box. OpenRouter, Groq, HuggingFace and Ollama slots ready — never locked in.",
  },
  {
    icon: Zap,
    title: "Wiring & BOM",
    body: "Ask for a wiring diagram or a Bill of Materials and get structured pin mappings + component lists your team can act on.",
  },
  {
    icon: Sparkles,
    title: "Datasheet Chat",
    body: "Talk to a senior engineer that has read the datasheet. Register maps, timing, application notes — clarified in seconds.",
  },
  {
    icon: ShieldCheck,
    title: "Production-ready",
    body: "JWT auth, rate limits, request IDs, structured logging, Docker-ready. Built for teams that ship silicon and firmware.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050B14] text-white overflow-hidden">
      {/* ================= NAV ================= */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#050B14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white" data-testid="link-features">Features</a>
            <a href="#boards" className="hover:text-white" data-testid="link-boards">Boards</a>
            <a href="#workspace" className="hover:text-white" data-testid="link-workspace">Workspace</a>
            <a href="#pricing" className="hover:text-white" data-testid="link-pricing">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" data-testid="landing-login-btn">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                Sign in
              </Button>
            </Link>
            <Link to="/register" data-testid="landing-register-btn">
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold">
                Start Forging <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative">
        <div className="absolute inset-0 hrl-grid-bg opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-900/40 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 hrl-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-xs font-mono uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                v1.0 — Powered by Claude Sonnet 4.6
              </div>
              <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
                Ship <span className="text-yellow-400">firmware</span>
                <br />
                at the speed
                <br />
                of thought.
              </h1>
              <p className="mt-8 text-lg text-slate-400 leading-relaxed max-w-xl">
                HRL Forge AI is a professional engineering platform for embedded systems,
                robotics, IoT and industrial automation. Not another ChatGPT wrapper —
                a workbench built by engineers, for engineers.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/register" data-testid="hero-cta-primary">
                  <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-12 px-6 text-base">
                    Enter the Workspace
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="#features" data-testid="hero-cta-secondary">
                  <Button variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white text-slate-300 h-12 px-6 text-base">
                    Explore the platform
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="mt-14 grid grid-cols-3 gap-8 max-w-lg">
                {[
                  ["8+", "Supported boards"],
                  ["6", "Languages / frameworks"],
                  ["100%", "Provider-agnostic"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-heading text-3xl font-bold text-yellow-400">{n}</div>
                    <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal preview */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-500/20 to-blue-500/10 rounded-2xl blur-2xl" />
                <div className="relative rounded-xl border border-white/10 bg-[#030712] overflow-hidden shadow-2xl">
                  <div className="h-9 border-b border-white/10 bg-[#050B14] flex items-center px-3 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    </div>
                    <span className="ml-2 text-xs font-mono text-slate-500">forge.myhrl.in — esp32-mqtt.ino</span>
                  </div>
                  <pre className="p-5 text-xs font-mono text-slate-300 leading-relaxed overflow-hidden">
{`#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define DHT_PIN     4
#define DHT_TYPE    DHT22
DHT dht(DHT_PIN, DHT_TYPE);

WiFiClient        net;
PubSubClient      mqtt(net);

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) delay(200);
  mqtt.setServer(BROKER, 1883);
}

void loop() {
  float t = dht.readTemperature();
  mqtt.publish("hrl/sensors/temp", String(t).c_str());
  delay(10000);
}`}
                    <span className="hrl-cursor" />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee of boards */}
        <div className="border-y border-white/5 bg-[#050B14]/60 py-4 overflow-hidden">
          <div className="flex gap-14 hrl-marquee whitespace-nowrap font-mono text-sm text-slate-500 uppercase tracking-widest">
            {[...BOARDS, ...LANGS, ...BOARDS, ...LANGS].map((b, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-yellow-500/50" /> {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-28">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono mb-3">
            / capabilities
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
            A workbench, not a chatbot.
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Everything an embedded team needs — provider-agnostic AI, hardware knowledge base,
            and a real code editor. Zero glue-code required.
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-xl border border-white/10 bg-[#0A1325] hover:border-yellow-500/40 transition-colors"
              data-testid={`feature-${f.title.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-4 group-hover:bg-yellow-500 group-hover:text-[#050B14] transition-colors">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= BOARDS SHOWCASE ================= */}
      <section id="boards" className="border-y border-white/5 bg-[#0A1325]/50">
        <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono mb-3">
              / hardware
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
              Speaks silicon.
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              The Forge knows the pinout, voltage tolerance, flash budget and interface set
              of every supported board. Prompts turn into <span className="text-yellow-400">correct</span>{" "}
              code — not plausible code.
            </p>
            <Link to="/register" className="inline-block mt-8" data-testid="boards-cta">
              <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11 px-5">
                Browse the board catalog
              </Button>
            </Link>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-3">
            {BOARDS.map((b) => (
              <div
                key={b}
                className="p-4 rounded-lg border border-white/10 bg-[#050B14] hover:border-yellow-500/40 hover:-translate-y-1 transition-transform"
              >
                <Cpu className="w-5 h-5 text-yellow-500 mb-3" />
                <div className="font-mono text-sm text-white">{b}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
                  supported
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WORKSPACE SPLIT ================= */}
      <section id="workspace" className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono mb-3">
              / workspace
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
              Prompt. Compile.
              <br />
              <span className="text-yellow-400">Deploy.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg">
              A resizable, IDE-grade workspace with prompt area, board & language pickers,
              and six output tabs — Code, Explanation, Libraries, Connections,
              Optimization and Download.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              {[
                "Monaco editor with syntax highlighting for C, C++, Python",
                "Structured connection tables — never hallucinated pins",
                "One-click Fix, Optimize, Review and Explain",
                "Per-project conversation memory",
              ].map((it) => (
                <li key={it} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-yellow-400 mt-2" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-yellow-500/10 to-blue-500/10 rounded-2xl blur-2xl" />
            <div className="relative rounded-xl border border-white/10 bg-[#030712] p-4">
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2 space-y-3">
                  <div className="p-3 rounded-md border border-white/10 bg-[#050B14]">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                      Prompt
                    </div>
                    <div className="text-xs font-mono text-slate-300 leading-relaxed">
                      Read DHT22 on GPIO 4, publish temperature to MQTT topic{" "}
                      <span className="text-yellow-400">hrl/sensors/temp</span> every 10s.
                    </div>
                  </div>
                  <div className="p-3 rounded-md border border-white/10 bg-[#050B14]">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                      Board / Language
                    </div>
                    <div className="text-xs font-mono text-white">ESP32 · Arduino C++</div>
                  </div>
                  <div className="text-center">
                    <span className="inline-block px-4 py-1.5 rounded-md bg-yellow-500 text-[#050B14] text-xs font-mono font-semibold">
                      GENERATE →
                    </span>
                  </div>
                </div>
                <div className="col-span-3 rounded-md border border-white/10 bg-[#030712] overflow-hidden">
                  <div className="flex border-b border-white/10 text-[10px] font-mono uppercase tracking-widest">
                    {["Code", "Explanation", "Libraries", "Wiring", "Optimize"].map((t, i) => (
                      <div
                        key={t}
                        className={`px-3 py-2 ${
                          i === 0
                            ? "text-yellow-400 border-b-2 border-yellow-500"
                            : "text-slate-500"
                        }`}
                      >
                        {t}
                      </div>
                    ))}
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-hidden">
{`#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#define PIN  4
DHT dht(PIN, DHT22);
...`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-24 text-center">
        <img
          src={HRL_LOGO}
          alt="HRL"
          className="w-20 h-20 mx-auto rounded-full ring-2 ring-yellow-500/40 mb-6"
        />
        <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
          Built by Hemalata Robotics Lab.
        </h2>
        <p className="mt-4 text-slate-400 text-lg">
          Passion for Innovation — since 2021. Join engineers building the next generation
          of embedded systems.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/register" data-testid="footer-cta">
            <Button className="bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-12 px-6 text-base">
              Create free account
            </Button>
          </Link>
          <Link to="/login" data-testid="footer-signin">
            <Button variant="outline" className="border-white/15 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white text-slate-300 h-12 px-6 text-base">
              I already have one
            </Button>
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/5 bg-[#030712]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-xs text-slate-500 font-mono">
            © 2026 Hemalata Robotics Lab · forge.myhrl.in
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Github className="w-4 h-4" />
            <span className="text-xs font-mono">api.myhrl.in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
