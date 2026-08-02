import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";

/**
 * OAuth landing page. Reads #session_id from the URL hash, exchanges it for
 * a JWT through the backend, and redirects to /app/dashboard.
 *
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
 * THIS BREAKS THE AUTH.
 */
export default function AuthCallback() {
  const nav = useNavigate();
  const location = useLocation();
  const { setUserFromToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      toast.error("Missing session — please try signing in again.");
      nav("/login", { replace: true });
      return;
    }
    const sessionId = decodeURIComponent(match[1]);

    (async () => {
      try {
        const { data } = await api.post("/auth/google", { session_id: sessionId });
        localStorage.setItem("hrl_token", data.access_token);
        // Clear the fragment before hydrating auth state
        const dest = localStorage.getItem("hrl_after_login") || "/app/dashboard";
        localStorage.removeItem("hrl_after_login");
        window.history.replaceState(null, "", dest);
        await setUserFromToken();
        toast.success(`Welcome, ${data.user.name.split(" ")[0]}`);
        nav(dest, { replace: true });
      } catch (e) {
        toast.error(e?.response?.data?.detail || "Google sign-in failed");
        nav("/login", { replace: true });
      }
    })();
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
      <div className="text-center">
        <Logo className="justify-center mb-8" />
        <Loader2 className="w-6 h-6 text-yellow-500 animate-spin mx-auto mb-3" />
        <div className="font-mono text-sm text-slate-400">Finalizing sign-in…</div>
      </div>
    </div>
  );
}
