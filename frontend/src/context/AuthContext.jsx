import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "mychef_token";
const NAME_KEY = "mychef_display_name";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage can throw in private-browsing / locked-down contexts.
      return null;
    }
  });

  // NOTE: your backend has no endpoint that returns the logged-in user's
  // actual name/username (/login only replies with access_token) — so this
  // is just whatever identifier they typed into the login field, kept
  // around for display purposes only. It is not fetched from the server.
  const [displayName, setDisplayName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) || "";
    } catch {
      return "";
    }
  });

  const login = useCallback((newToken, name) => {
    setToken(newToken);
    if (name) setDisplayName(name);
    try {
      localStorage.setItem(STORAGE_KEY, newToken);
      if (name) localStorage.setItem(NAME_KEY, name);
    } catch {
      // Ignore — the session still works for this tab via state.
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setDisplayName("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NAME_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  const value = useMemo(
    () => ({ token, isAuthenticated: Boolean(token), displayName, login, logout }),
    [token, displayName, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
