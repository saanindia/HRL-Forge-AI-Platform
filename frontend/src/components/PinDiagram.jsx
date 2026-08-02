import React from "react";
import { Cpu, Zap } from "lucide-react";

/**
 * Visual pin-mapping diagram.
 *
 * Renders a stylized board silhouette with pins as dots. Any pin that appears
 * in the connections list is highlighted in gold and labeled with its
 * component. Non-graphical fallback: a legend list under the diagram.
 */
export function PinDiagram({ board, connections }) {
  if (!board) return null;

  // Extract the board_pin strings the AI returned, e.g. "D13", "GPIO 4", "A0", "PB6", "3.3V", "GND"
  const active = connections.map((c) => ({
    label: normalizePin(c.board_pin),
    raw: c.board_pin,
    component: c.component,
    componentPin: c.pin,
    notes: c.notes,
  }));

  // Build the pin list for the target board (best-effort — accurate for common Arduino / ESP32 layouts)
  const layout = getLayout(board.slug, board.gpio);

  const activeMap = new Map(active.map((a) => [a.label, a]));

  return (
    <div className="space-y-6">
      {/* Board visual */}
      <div className="relative mx-auto rounded-xl border border-white/10 bg-black/40 p-8 max-w-3xl">
        <div className="absolute top-3 left-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          {board.name}
        </div>
        <div className="absolute top-3 right-4 text-[10px] font-mono text-slate-600">
          ⓘ dashed = ground / power rail
        </div>

        <div className="mt-6">
          <div
            className="mx-auto rounded-lg bg-gradient-to-b from-[#0B2A5B]/80 to-[#050B14] border-2 border-yellow-500/20 relative"
            style={{ height: 220, maxWidth: 460 }}
          >
            {/* MCU chip in the middle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 rounded bg-black/60 border border-yellow-500/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-yellow-500" />
              <span className="ml-1.5 text-[10px] font-mono text-yellow-400">
                {board.mcu.split(" ")[0]}
              </span>
            </div>

            {/* Top pin row */}
            <PinRow
              side="top"
              pins={layout.top}
              activeMap={activeMap}
            />
            {/* Bottom pin row */}
            <PinRow
              side="bottom"
              pins={layout.bottom}
              activeMap={activeMap}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-mono uppercase tracking-widest text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> in use
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> free
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border border-yellow-400/50 bg-transparent" />{" "}
            power / ground
          </span>
        </div>
      </div>

      {/* Active connections list */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-3">
          Active connections ({active.length})
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {active.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-black/20"
              data-testid={`diagram-conn-${i}`}
            >
              <div className="w-9 h-9 rounded bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 font-mono text-xs">
                <Zap className="w-3 h-3 mr-0.5" />
                {a.label.length > 4 ? a.label.slice(0, 4) : a.label}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white truncate">{a.component}</div>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  pin {a.componentPin} → <span className="text-yellow-400">{a.raw}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PinRow({ side, pins, activeMap }) {
  const isTop = side === "top";
  return (
    <div
      className="absolute left-4 right-4 flex justify-between items-center"
      style={{ [isTop ? "top" : "bottom"]: -8 }}
    >
      {pins.map((p, idx) => {
        const a = activeMap.get(normalizePin(p));
        const isPower = /(vcc|3v3|5v|gnd|vin)/i.test(p);
        return (
          <div key={idx} className="flex flex-col items-center">
            {isTop && a && (
              <div className="text-[9px] font-mono text-yellow-400 mb-1 whitespace-nowrap px-1">
                {shortComponent(a.component)}
              </div>
            )}
            <div
              className={`w-3 h-3 rounded-full ${
                a
                  ? "bg-yellow-400 ring-2 ring-yellow-500/30"
                  : isPower
                  ? "bg-transparent border border-yellow-400/40"
                  : "bg-slate-700"
              }`}
              title={p}
            />
            <div
              className={`text-[9px] font-mono mt-1 ${
                a ? "text-yellow-400" : "text-slate-600"
              }`}
            >
              {p.replace(/GPIO\s*/i, "")}
            </div>
            {!isTop && a && (
              <div className="text-[9px] font-mono text-yellow-400 mt-1 whitespace-nowrap px-1">
                {shortComponent(a.component)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function shortComponent(name) {
  const s = name || "";
  return s.length > 12 ? s.slice(0, 11) + "…" : s;
}

function normalizePin(p) {
  if (!p) return "";
  return String(p)
    .trim()
    .toUpperCase()
    .replace(/^PIN\s*/, "")
    .replace(/^GPIO\s*/, "GPIO")
    .replace(/\s+/g, "");
}

/**
 * Simple per-board pin layouts — accurate for the "important" pins the AI
 * tends to reference. Fallbacks to a generic GPIO grid for unknown boards.
 */
function getLayout(slug, gpio = 20) {
  const preset = {
    "arduino-uno": {
      top: ["D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0"],
      bottom: ["A0", "A1", "A2", "A3", "A4", "A5", "5V", "3.3V", "GND", "GND", "VIN", "RESET"],
    },
    "arduino-nano": {
      top: ["D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2"],
      bottom: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "5V", "3.3V", "GND", "VIN"],
    },
    "arduino-mega": {
      top: ["D22", "D24", "D26", "D28", "D30", "D32", "D34", "D36", "D38", "D40", "D42", "D44", "D46", "D48", "D50", "D52"],
      bottom: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "5V", "3.3V", "GND", "GND", "VIN", "RESET"],
    },
    "esp32": {
      top: ["GPIO23", "GPIO22", "GPIO21", "GPIO19", "GPIO18", "GPIO5", "GPIO17", "GPIO16", "GPIO4", "GPIO2", "GPIO15"],
      bottom: ["GPIO13", "GPIO12", "GPIO14", "GPIO27", "GPIO26", "GPIO25", "GPIO33", "GPIO32", "3V3", "5V", "GND"],
    },
    "esp8266": {
      top: ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
      bottom: ["A0", "3V3", "5V", "GND", "GND", "TX", "RX", "RST"],
    },
    "stm32": {
      top: ["PA0", "PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "PA7", "PB0", "PB1", "PB10", "PB11"],
      bottom: ["PB12", "PB13", "PB14", "PB15", "PC13", "PC14", "PC15", "3V3", "5V", "GND", "GND", "VIN"],
    },
    "atmega328p": {
      top: ["PD0", "PD1", "PD2", "PD3", "PD4", "PD5", "PD6", "PD7", "PB0", "PB1", "PB2", "PB3", "PB4", "PB5"],
      bottom: ["PC0", "PC1", "PC2", "PC3", "PC4", "PC5", "VCC", "GND", "AVCC", "AREF", "RESET", "XTAL1", "XTAL2"],
    },
    "rpi-pico": {
      top: ["GP0", "GP1", "GP2", "GP3", "GP4", "GP5", "GP6", "GP7", "GP8", "GP9", "GP10", "GP11", "GP12", "GP13"],
      bottom: ["GP14", "GP15", "GP16", "GP17", "GP18", "GP19", "GP20", "GP21", "GP22", "GP26", "GP27", "GP28", "3V3", "GND", "VBUS"],
    },
  };
  if (preset[slug]) return preset[slug];
  // Generic fallback
  const half = Math.ceil(Math.min(gpio, 20) / 2);
  return {
    top: Array.from({ length: half }, (_, i) => `P${i}`),
    bottom: Array.from({ length: half }, (_, i) => `P${i + half}`).concat(["VCC", "GND"]),
  };
}
