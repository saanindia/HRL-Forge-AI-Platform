import React from "react";
import { HRL_LOGO } from "@/lib/api";

export const Logo = ({ size = 28, showText = true, className = "" }) => (
  <div className={`flex items-center gap-2.5 ${className}`} data-testid="hrl-logo">
    <img
      src={HRL_LOGO}
      alt="HRL"
      style={{ width: size, height: size }}
      className="rounded-full ring-1 ring-yellow-500/40"
    />
    {showText && (
      <div className="leading-tight">
        <div className="font-heading font-bold text-white text-sm tracking-tight">
          HRL Forge AI
        </div>
        <div className="text-[10px] text-yellow-500/80 uppercase tracking-[0.15em] font-mono">
          Passion for Innovation
        </div>
      </div>
    )}
  </div>
);
