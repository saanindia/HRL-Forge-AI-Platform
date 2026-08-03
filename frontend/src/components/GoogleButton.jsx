import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * "Continue with Google" button using Google Identity Services (GSI).
 *
 * Requires REACT_APP_GOOGLE_CLIENT_ID (frontend) and GOOGLE_CLIENT_ID (backend)
 * to be set. When unset, the button still renders but explains the config gap
 * on click.
 */
export function GoogleButton({ label = "Continue with Google" }) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const { setUserFromToken } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const initialised = useRef(false);

  // Initialise GSI once script + client_id are available
  useEffect(() => {
    if (!clientId) return;
    if (initialised.current) return;
    const tryInit = () => {
      const gsi = window.google?.accounts?.id;
      if (!gsi) return false;
      gsi.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) return;
          setBusy(true);
          try {
            const { data } = await api.post("/auth/google", {
              id_token: response.credential,
            });
            localStorage.setItem("hrl_token", data.access_token);
            await setUserFromToken();
            const dest = localStorage.getItem("hrl_after_login") || "/app/dashboard";
            localStorage.removeItem("hrl_after_login");
            toast.success(`Welcome, ${data.user.name.split(" ")[0]}`);
            nav(dest, { replace: true });
          } catch (e) {
            toast.error(
              e?.response?.data?.detail || "Google sign-in failed"
            );
          } finally {
            setBusy(false);
          }
        },
      });
      initialised.current = true;
      return true;
    };
    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 200);
      const timeout = setTimeout(() => clearInterval(interval), 8000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [clientId, nav, setUserFromToken]);

  const handleClick = () => {
    if (!clientId) {
      toast.error(
        "Google sign-in not configured. Set REACT_APP_GOOGLE_CLIENT_ID in frontend .env and GOOGLE_CLIENT_ID in backend .env, then restart."
      );
      return;
    }
    const gsi = window.google?.accounts?.id;
    if (!gsi) {
      toast.error("Google sign-in is still loading — try again in a moment.");
      return;
    }
    gsi.prompt();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={busy}
      variant="outline"
      className="w-full h-11 bg-white text-[#050B14] hover:bg-slate-100 border-0 font-medium gap-2"
      data-testid="google-signin-btn"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <GoogleIcon />
          {label}
        </>
      )}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
