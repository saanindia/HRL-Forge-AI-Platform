import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050B14] text-slate-400 font-mono text-sm">
        <span className="hrl-cursor">Initializing HRL Forge AI</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
