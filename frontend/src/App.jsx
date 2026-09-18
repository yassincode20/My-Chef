import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import PreferencesPage from "./pages/PreferencesPage";
import KitchenPage from "./pages/KitchenPage";
import RecipeListPage from "./pages/RecipeListPage";

function Gate() {
  const { isAuthenticated, token } = useAuth();
  // "preferences" | "kitchen" | "recipes" — every fresh login lands on
  // preferences first; PreferencesPage only offers "Continue to kitchen"
  // once a saved row exists.
  const [screen, setScreen] = useState("preferences");

  // Reset to preferences on every new login (token changes), not just once
  // on first mount, so logging out and back in doesn't strand you on the
  // kitchen/recipes screen from a previous session.
  useEffect(() => {
    if (token) setScreen("preferences");
  }, [token]);

  if (!isAuthenticated) return <AuthPage />;

  if (screen === "kitchen") {
    return (
      <KitchenPage
        onEditPreferences={() => setScreen("preferences")}
        onShowRecipes={() => setScreen("recipes")}
      />
    );
  }

  if (screen === "recipes") {
    return (
      <RecipeListPage
        onBackToKitchen={() => setScreen("kitchen")}
        onEditPreferences={() => setScreen("preferences")}
      />
    );
  }

  return <PreferencesPage onContinue={() => setScreen("kitchen")} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
