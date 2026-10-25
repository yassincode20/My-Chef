// Talks to the FastAPI backend through Vite's /api proxy (see vite.config.js),
// so this always hits whatever VITE_API_URL points the proxy at — by default
// http://localhost:8000.
export const BASE = "/api";

export async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // /login can return a plain string on failure, e.g.
    // "user not found due invalid data" — not valid JSON, so keep it raw.
    return text;
  }
}

// /register and /login answer failures with proper 4xx statuses and a
// {"detail": "..."} body. These helpers normalize that so the forms only
// ever deal with { ok, data, message }.

export async function registerUser({ user_name, name, email, password }) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_name, name, email, password }),
  });
  const data = await parseBody(res);

  if (!res.ok) {
    return { ok: false, message: extractMessage(data) || `Request failed (${res.status})` };
  }
  if (data && typeof data === "object" && "error" in data) {
    return { ok: false, message: data.error };
  }
  return { ok: true, data };
}

export async function loginUser({ login, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const data = await parseBody(res);

  if (!res.ok) {
    return { ok: false, message: extractMessage(data) || `Request failed (${res.status})` };
  }
  if (data && typeof data === "object" && data.access_token) {
    return { ok: true, token: data.access_token, name: data.name, username: data.user_name };
  }
  // Anything unexpected is treated as a failed login.
  return { ok: false, message: "Invalid username/email or password" };
}

export function extractMessage(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object" && "error" in data) return data.error;
  if (typeof data === "object" && "detail" in data) {
    return typeof data.detail === "string" ? data.detail : "";
  }
  return "";
}
