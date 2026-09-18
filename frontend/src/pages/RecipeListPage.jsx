import { useEffect, useState } from "react";
import FormMessage from "../components/FormMessage";
import UserMenu from "../components/UserMenu";
import { fetchRecipeHistory } from "../recipeApi";
import { useAuth } from "../context/AuthContext";
import "./RecipeListPage.css";
import "../components/forms.css";

// We don't have databasemodel.py's recipe_info column names, only that
// create_recipe stores at least `name` and `recipe` (from how it builds
// the row). This reads a handful of likely field-name variants
// defensively so it still shows something useful even if the real
// column names differ slightly, rather than silently rendering blanks.
function pickField(row, candidates, fallback = "") {
  for (const key of candidates) {
    if (row && row[key] != null && row[key] !== "") return row[key];
  }
  return fallback;
}

export default function RecipeListPage({ onBackToKitchen, onEditPreferences }) {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchRecipeHistory(token);
      if (cancelled) return;
      if (result.unauthorized) {
        logout();
        return;
      }
      if (!result.ok) {
        setError(result.message || "Couldn't load your recipes, try again.");
      } else {
        setRecipes(result.recipes);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  return (
    <div className="recipe-list-page">
      <UserMenu onEditPreferences={onEditPreferences} />

      <div className="recipe-list-card">
        <div className="recipe-list-card__header">
          <h1 className="recipe-list-card__title">Your recipes</h1>
          <button type="button" className="auth-switch__link" onClick={onBackToKitchen}>
            Back to kitchen
          </button>
        </div>

        {loading ? (
          <p className="preferences-loading">Loading your recipes...</p>
        ) : error ? (
          <FormMessage tone="error">{error}</FormMessage>
        ) : recipes.length === 0 ? (
          <p className="recipe-list-empty">
            No recipes yet — head back to the kitchen and cook something.
          </p>
        ) : (
          <ul className="recipe-list">
            {recipes.map((row, i) => {
              const name = pickField(row, ["name", "recipe_name", "title"], "Untitled recipe");
              const body = pickField(row, ["recipe", "recipe_text", "content"], "");
              const key = pickField(row, ["id", "recipe_id"], i);
              return (
                <li className="recipe-list__item" key={key}>
                  <h2 className="recipe-list__item-name">{name}</h2>
                  {body ? <p className="recipe-list__item-body">{body}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
