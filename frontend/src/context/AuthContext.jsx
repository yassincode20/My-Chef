import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "mychef_token";
const NAME_KEY = "mychef_name";
const USERNAME_KEY = "mychef_username";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage can throw in private-browsing / locked-down contexts.
      return null;
    }
  });

  // Real values from the server (/login now returns name + user_name),
  // not guessed from whatever the user typed into the login field.
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) || "";
    } catch {
      return "";
    }
  });
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem(USERNAME_KEY) || "";
    } catch {
      return "";
    }
  });

  // Updates the displayed name/username without touching the token — used
  // for the "legit": "True" branch of /login, which confirms an existing
  // session but doesn't issue a fresh access_token.
  const updateProfile = useCallback((newName, newUsername) => {
    if (newName) setName(newName);
    if (newUsername) setUsername(newUsername);
    try {
      if (newName) localStorage.setItem(NAME_KEY, newName);
      if (newUsername) localStorage.setItem(USERNAME_KEY, newUsername);
    } catch {
      // Ignore — the session still works for this tab via state.
    }
  }, []);

  const login = useCallback(
    (newToken, newName, newUsername) => {
      setToken(newToken);
      updateProfile(newName, newUsername);
      try {
        localStorage.setItem(STORAGE_KEY, newToken);
      } catch {
        // Ignore — the session still works for this tab via state.
      }
    },
    [updateProfile]
  );

  const logout = useCallback(() => {
    setToken(null);
    setName("");
    setUsername("");
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(USERNAME_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      name,
      username,
      login,
      updateProfile,
      logout,
    }),
    [token, name, username, login, updateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
