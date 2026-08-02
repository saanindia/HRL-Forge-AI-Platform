import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Play,
  Loader2,
  ExternalLink,
  Terminal,
  Info,
  Copy,
  Cpu,
  RefreshCw,
} from "lucide-react";

/**
 * SimulatePanel — combines two lightweight ways to "test" generated code:
 *
 *  1. Wokwi launcher — opens Wokwi's free browser simulator with the target
 *     board selected. Code is copied to the clipboard so the user pastes once.
 *  2. AI Serial Preview — asks Claude to synthesize what the Serial Monitor
 *     would print. Not a real emulator but excellent for verifying intent.
 */
export function SimulatePanel({ code, board, language, prompt }) {
  const [loading, setLoading] = useState(false);
  const [serial, setSerial] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  const wokwiBoard = mapWokwiBoard(board);
  const canWokwi = !!wokwiBoard;

  const openWokwi = async () => {
    // Always launches Wokwi — with the current code if there is any, otherwise
    // opens the plain board template so the user can experiment.
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        toast.success("Code copied — paste into Wokwi's editor with ⌘/Ctrl+V");
      } catch (_) {
        toast.info("Wokwi opened — copy your code manually if needed");
      }
    } else {
      toast.info(`Opening empty ${humanBoard(board)} playground on Wokwi`);
    }
    window.open(`https://wokwi.com/projects/new/${wokwiBoard}`, "_blank", "noopener");
  };

  const runSerialPreview = async () => {
    if (!code) return toast.error("Generate code first");
    setLoading(true);
    try {
      const { data } = await api.post("/generate", {
        prompt: prompt || "Simulate this program.",
        board,
        language,
        mode: "serial",
        existing_code: code,
      });
      setSerial(stripMarkdown(data.explanation || "(no serial output produced)"));
      toast.success("Serial output simulated");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.03] flex items-start gap-3">
        <Info className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="text-yellow-400 font-medium">Two ways to try your code:</span>{" "}
          Run in <b>Wokwi</b> (free browser-based hardware simulator with real virtual
          components) or preview the <b>Serial Monitor</b> output synthesized by HRL Forge
          AI. Both are ideal before you flash real hardware.
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Wokwi launcher */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0A1325]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <div className="font-heading font-semibold text-white">Wokwi Simulator</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                real-hardware emulator
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Wokwi runs your firmware against a virtual{" "}
            <span className="text-white">{humanBoard(board)}</span> with virtual sensors,
            LEDs and serial. Perfect for a smoke-test before you touch a breadboard.
          </p>
          {canWokwi ? (
            <Button
              onClick={openWokwi}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11"
              data-testid="wokwi-launch-btn"
            >
              <Play className="w-4 h-4 mr-2" />
              {code ? "Launch in Wokwi with code" : "Open empty Wokwi playground"}
              <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
            </Button>
          ) : (
            <div className="text-xs text-slate-500 font-mono px-3 py-2 border border-dashed border-white/10 rounded-md">
              Wokwi does not support <b className="text-slate-300">{board}</b> yet — the
              Serial Preview on the right still works.
            </div>
          )}
          <div className="mt-3 text-[10px] text-slate-600 font-mono">
            {code
              ? "Code is copied to your clipboard — paste with ⌘/Ctrl+V once the Wokwi editor opens."
              : "Generate code first if you want the sketch pre-copied, or start from scratch."}
          </div>
        </div>

        {/* Serial preview trigger */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0A1325]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <div className="font-heading font-semibold text-white">Serial Preview</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                ai-simulated output
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            HRL Forge AI reads the current code and synthesizes what the Serial Monitor
            would print — startup messages, sensor values, MQTT handshakes, loop cycles.
          </p>
          <Button
            onClick={runSerialPreview}
            disabled={loading || !code}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold h-11"
            data-testid="serial-preview-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulating…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {serial ? "Regenerate serial" : "Generate serial output"}
              </>
            )}
          </Button>
          <div className="mt-3 text-[10px] text-slate-600 font-mono">
            Best-effort simulation — real behaviour on hardware may differ.
          </div>
        </div>
      </div>

      {/* Serial monitor terminal */}
      <div className="rounded-xl border border-white/10 bg-black/70 overflow-hidden">
        <div className="h-9 border-b border-white/10 bg-[#050B14] flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
              Serial Monitor · 115200 baud
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-yellow-500"
              />
              autoscroll
            </label>
            {serial && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(serial);
                  toast.success("Serial log copied");
                }}
                className="text-slate-500 hover:text-yellow-400"
                data-testid="serial-copy-btn"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div
          className="p-4 font-mono text-xs leading-relaxed max-h-[380px] overflow-y-auto"
          style={{ scrollBehavior: autoScroll ? "smooth" : "auto" }}
        >
          {serial ? (
            <pre className="whitespace-pre-wrap text-green-400" data-testid="serial-output">
              {serial}
              <span className="hrl-cursor" />
            </pre>
          ) : (
            <div className="text-slate-600">
              &gt; awaiting simulation…
              <span className="hrl-cursor" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Map internal board slugs to Wokwi's board identifiers.
 * See https://docs.wokwi.com/getting-started/supported-hardware
 */
function mapWokwiBoard(slug) {
  const map = {
    "arduino-uno": "arduino-uno",
    "arduino-nano": "arduino-nano",
    "arduino-mega": "arduino-mega",
    "esp32": "esp32",
    "esp8266": "esp8266",
    "rpi-pico": "pi-pico",
    "atmega328p": "arduino-uno", // closest match on Wokwi
  };
  return map[slug] || null;
}

function humanBoard(slug) {
  const m = {
    "arduino-uno": "Arduino Uno",
    "arduino-nano": "Arduino Nano",
    "arduino-mega": "Arduino Mega",
    "esp32": "ESP32",
    "esp8266": "ESP8266",
    "rpi-pico": "Raspberry Pi Pico",
    "atmega328p": "ATmega328P",
    "stm32": "STM32 Blue Pill",
  };
  return m[slug] || slug;
}

/** Strip any accidental markdown wrappers so the serial monitor stays terminal-pure. */
function stripMarkdown(text) {
  return String(text)
    // Drop code fences ```...```
    .replace(/```[a-zA-Z0-9]*\n?/g, "")
    .replace(/```/g, "")
    // Drop markdown headings (## Title, # Title) at the start of a line
    .replace(/^#{1,6}\s.*$/gm, "")
    // Drop bold/italic markers
    .replace(/\*\*/g, "")
    .replace(/(^|\s)_([^_]+)_/g, "$1$2")
    // Trim leading/trailing blank lines
    .replace(/^\s+|\s+$/g, "")
    // Collapse >2 consecutive blank lines
    .replace(/\n{3,}/g, "\n\n");
}
