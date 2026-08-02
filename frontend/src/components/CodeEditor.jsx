import React from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ value, onChange, language = "cpp", height = "500px", readOnly = false }) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-[#030712]" data-testid="code-editor">
      <div className="h-9 border-b border-white/10 bg-[#050B14] flex items-center px-3 gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="ml-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
          {language}
        </span>
      </div>
      <Editor
        height={height}
        theme="vs-dark"
        language={mapLang(language)}
        value={value}
        onChange={(v) => onChange?.(v || "")}
        options={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          readOnly,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          renderLineHighlight: "gutter",
        }}
      />
    </div>
  );
}

function mapLang(l) {
  const s = (l || "").toLowerCase();
  if (s.includes("micro") || s.includes("circuit") || s.includes("python")) return "python";
  if (s.includes("c++") || s.includes("cpp") || s.includes("arduino")) return "cpp";
  if (s.includes("embedded c") || s === "c") return "c";
  return "cpp";
}
