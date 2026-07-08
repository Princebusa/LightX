import { Navigate } from "react-router-dom";
import { type ReactNode, useEffect, useState } from "react";
import { clearAuthToken, getAuthToken } from "@/lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());

  useEffect(() => {
    const onAuthChanged = () => setToken(getAuthToken());
    const onUnauthorized = () => {
      clearAuthToken();
      setToken(null);
    };

    window.addEventListener("lightx:auth-changed", onAuthChanged);
    window.addEventListener("lightx:unauthorized", onUnauthorized);

    return () => {
      window.removeEventListener("lightx:auth-changed", onAuthChanged);
      window.removeEventListener("lightx:unauthorized", onUnauthorized);
    };
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

