import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Workspace from "@/pages/Workspace";
import Projects from "@/pages/Projects";
import Templates from "@/pages/Templates";
import Boards from "@/pages/Boards";
import History from "@/pages/History";
import Settings from "@/pages/Settings";
import Documentation from "@/pages/Documentation";
import Admin from "@/pages/Admin";
import Assistant from "@/pages/Assistant";
import WiringGenerator from "@/pages/WiringGenerator";
import AuthCallback from "@/pages/AuthCallback";
import SharedWiring from "@/pages/SharedWiring";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#0A1325",
              border: "1px solid rgba(234, 179, 8, 0.2)",
              color: "#F8FAFC",
              fontFamily: "IBM Plex Sans, sans-serif",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/share/wiring/:token" element={<SharedWiring />} />
          <Route
            path="/app"
            element={<Navigate to="/app/dashboard" replace />}
          />
          <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/app/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
          <Route path="/app/wiring" element={<ProtectedRoute><WiringGenerator /></ProtectedRoute>} />
          <Route path="/app/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/app/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/app/boards" element={<ProtectedRoute><Boards /></ProtectedRoute>} />
          <Route path="/app/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/app/docs" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
          <Route path="/app/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/app/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
