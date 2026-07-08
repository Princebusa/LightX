import { apiFetch, clearAuthToken, getAuthToken, setAuthToken } from "./api";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

type AuthResponse = {
  token: string;
};

export async function login(input: LoginInput): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  setAuthToken(res.token);
  window.dispatchEvent(new CustomEvent("lightx:auth-changed"));

  return res;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  setAuthToken(res.token);
  window.dispatchEvent(new CustomEvent("lightx:auth-changed"));

  return res;
}

export function logout() {
  const hadToken = Boolean(getAuthToken());
  clearAuthToken();
  if (hadToken) {
    window.dispatchEvent(new CustomEvent("lightx:auth-changed"));
  }
}

