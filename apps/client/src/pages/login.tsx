import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border/60 bg-card/90 p-6">
        <h1 className="text-2xl font-semibold mb-1">Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your email and password.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setError(null);
            try {
              await login({ email, password });
              navigate("/dashboard", { replace: true });
            } catch (err) {
              const message =
                err instanceof ApiError ? err.message : "Login failed";
              setError(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-sm text-muted-foreground pt-2 text-center">
              No account?{" "}
              <Link className="underline" to="/register">
                Create one
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

