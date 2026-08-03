import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { HRL_LOGO } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back to HRL Forge");
      const dest = localStorage.getItem("hrl_after_login");
      localStorage.removeItem("hrl_after_login");
      nav(dest || "/app/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#050B14] text-white">
      {/* Left panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 border-r border-white/5 bg-[#030712] overflow-hidden">
        <div className="absolute inset-0 hrl-grid-bg opacity-30" />
        <div className="relative z-10">
          <Link to="/" data-testid="login-back-home">
            <Logo />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <img src={HRL_LOGO} alt="HRL" className="w-20 h-20 rounded-full ring-2 ring-yellow-500/40 mb-8" />
          <h2 className="font-heading text-4xl font-bold tracking-tight leading-tight">
            Ship firmware at the speed of thought.
          </h2>
          <p className="mt-4 text-slate-400">
            Sign in to your workbench and continue where you left off — projects, history,
            saved templates.
          </p>
        </div>
        <div className="relative z-10 text-xs font-mono text-slate-500">
          © Hemalata Robotics Lab · Est. 2021
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md space-y-6" data-testid="login-form">
          <div className="lg:hidden mb-8">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono mb-2">
              / sign in
            </div>
            <h1 className="font-heading text-3xl font-bold">Welcome back, engineer.</h1>
            <p className="mt-2 text-sm text-slate-400">
              New here?{" "}
              <Link to="/register" className="text-yellow-400 hover:text-yellow-300" data-testid="login-register-link">
                Create an account
              </Link>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@myhrl.in"
              className="bg-black/30 border-white/10 h-11"
              data-testid="login-email-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/30 border-white/10 h-11"
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold"
            data-testid="login-submit-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter the Forge"}
          </Button>

          <div className="text-xs text-center text-slate-500 font-mono">
            Social login (Google / GitHub) — coming soon.
          </div>
        </form>
      </div>
    </div>
  );
}
