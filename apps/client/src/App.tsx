import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import Dashboard from "./pages/dashboard";
import ChatPage from "./pages/chat";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import { RequireAuth } from "./auth/AuthGate";
import { getAuthToken } from "@/lib/api";

function App() {
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  useEffect(() => {
    const onAuthChanged = () => setToken(getAuthToken());
    window.addEventListener("lightx:auth-changed", onAuthChanged);
    window.addEventListener("lightx:unauthorized", onAuthChanged);
    return () => {
      window.removeEventListener("lightx:auth-changed", onAuthChanged);
      window.removeEventListener("lightx:unauthorized", onAuthChanged);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:projectId"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
