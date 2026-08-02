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
import { GoogleButton } from "@/components/GoogleButton";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      toast.success("Account created. Welcome to HRL Forge AI.");
      nav("/app/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#050B14] text-white">
      <div className="relative hidden lg:flex flex-col justify-between p-10 border-r border-white/5 bg-[#030712] overflow-hidden">
        <div className="absolute inset-0 hrl-grid-bg opacity-30" />
        <div className="relative z-10">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="relative z-10 max-w-md">
          <img src={HRL_LOGO} alt="HRL" className="w-20 h-20 rounded-full ring-2 ring-yellow-500/40 mb-8" />
          <h2 className="font-heading text-4xl font-bold tracking-tight leading-tight">
            Your engineering workbench.
          </h2>
          <p className="mt-4 text-slate-400">
            Create your account in seconds. Free during beta — no credit card required.
          </p>
        </div>
        <div className="relative z-10 text-xs font-mono text-slate-500">
          Passion for Innovation
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md space-y-5" data-testid="register-form">
          <div className="lg:hidden mb-8"><Link to="/"><Logo /></Link></div>
          <div>
            <div className="text-xs uppercase tracking-widest text-yellow-500 font-mono mb-2">
              / create account
            </div>
            <h1 className="font-heading text-3xl font-bold">Start Forging.</h1>
            <p className="mt-2 text-sm text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-yellow-400 hover:text-yellow-300" data-testid="register-login-link">
                Sign in
              </Link>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Full name</Label>
            <Input
              id="name" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ada Lovelace"
              className="bg-black/30 border-white/10 h-11"
              data-testid="register-name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@myhrl.in"
              className="bg-black/30 border-white/10 h-11"
              data-testid="register-email-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password" type="password" required minLength={6} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="bg-black/30 border-white/10 h-11"
              data-testid="register-password-input"
            />
          </div>

          <Button
            type="submit" disabled={loading}
            className="w-full h-11 bg-yellow-500 hover:bg-yellow-400 text-[#050B14] font-semibold"
            data-testid="register-submit-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
          </Button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <GoogleButton label="Sign up with Google" />

          <p className="text-xs text-slate-500 text-center">
            By continuing you agree to HRL's Terms & Privacy policy.
          </p>
        </form>
      </div>
    </div>
  );
}
