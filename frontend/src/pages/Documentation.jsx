import React from "react";
import AppShell from "@/components/AppShell";
import { BookOpen, Cpu, Terminal, Sparkles, MessageSquareCode } from "lucide-react";

export default function Documentation() {
  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono">/ docs</div>
          <h1 className="font-heading text-4xl font-bold mt-1">Documentation</h1>
          <p className="text-slate-400 mt-2">A short guide to getting the most out of HRL Forge AI.</p>
        </div>

        <Section icon={Terminal} title="1 — The AI Workspace">
          <p>The Workspace is where you talk to Forge. Pick a board, a language, describe
          what you want to build, and hit <span className="text-yellow-400 font-mono">Generate</span>. The output splits into six tabs:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-3 text-slate-300">
            <li><b className="text-white">Code</b> — the compilable source, editable in Monaco.</li>
            <li><b className="text-white">Explanation</b> — engineering-grade walkthrough of the logic.</li>
            <li><b className="text-white">Libraries</b> — required libraries (with versions where available).</li>
            <li><b className="text-white">Connections</b> — pin-accurate wiring table.</li>
            <li><b className="text-white">Optimization</b> — memory / power / latency notes.</li>
            <li><b className="text-white">Download</b> — save as <code>.ino</code>, <code>.c</code> or <code>.py</code>.</li>
          </ul>
        </Section>

        <Section icon={Sparkles} title="2 — Modes">
          <p>Beyond Generate, the same prompt can drive several modes:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs font-mono uppercase tracking-widest">
            {["Fix", "Optimize", "Review", "Explain", "Wiring", "BOM"].map((m) => (
              <div key={m} className="px-3 py-2 rounded-md border border-white/10 bg-white/[0.02] text-slate-300 text-center">{m}</div>
            ))}
          </div>
        </Section>

        <Section icon={Cpu} title="3 — Boards & Knowledge">
          <p>HRL Forge ships with detailed knowledge for Arduino Uno / Nano / Mega,
          ESP32, ESP8266, STM32 Blue Pill, ATmega328P and Raspberry Pi Pico —
          plus a sensor / module catalog and protocol reference.</p>
        </Section>

        <Section icon={MessageSquareCode} title="4 — Circuit & Datasheet Chat">
          <p>Need to explore a component before generating code? Head to the
          <span className="text-yellow-400"> Circuit Assistant</span> and chat with an
          embedded engineer that has read the datasheet.</p>
        </Section>

        <Section icon={BookOpen} title="5 — REST API">
          <p>All functionality is exposed under <code className="text-yellow-400 font-mono">/api/v1</code>.
          Endpoints: <code>/auth</code>, <code>/projects</code>, <code>/generate</code>,
          <code>/history</code>, <code>/templates</code>, <code>/boards</code>,
          <code>/chat</code>, <code>/settings</code>, <code>/admin</code>.
          Full OpenAPI schema at <code className="text-yellow-400 font-mono">/docs</code> on the backend.</p>
        </Section>
      </div>
    </AppShell>
  );
}

const Section = ({ icon: Icon, title, children }) => (
  <section className="mb-10">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-yellow-500" />
      </div>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
    </div>
    <div className="text-slate-400 leading-relaxed text-sm pl-10">{children}</div>
  </section>
);
