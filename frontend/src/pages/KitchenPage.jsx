import { useState } from "react";
import Button from "../components/Button";
import FormMessage from "../components/FormMessage";
import UserMenu from "../components/UserMenu";
import { cookRecipe } from "../recipeApi";
import { useAuth } from "../context/AuthContext";
import "./KitchenPage.css";

export default function KitchenPage({ onEditPreferences, onShowRecipes }) {
  const { token, logout } = useAuth();
  const [ingredients, setIngredients] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null); // { name, recipe }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmed = ingredients.trim();
    if (!trimmed) {
      setError("Type at least one ingredient first.");
      return;
    }

    setLoading(true);
    setRecipe(null);
    const result = await cookRecipe(token, trimmed);
    setLoading(false);

    if (result.unauthorized) {
      logout();
      return;
    }
    if (!result.ok) {
      setError(result.message || "Something went wrong, try again.");
      return;
    }
    setRecipe({ name: result.name, recipe: result.recipe });
  }

  function handleCookAnother() {
    setRecipe(null);
    setIngredients("");
    setError("");
  }

  return (
    <div className="kitchen-page">
      <UserMenu onEditPreferences={onEditPreferences} onShowRecipes={onShowRecipes} />

      <div className="kitchen-card">
        <h1 className="kitchen-card__title">What's in your kitchen?</h1>
        <p className="kitchen-card__text">
          List what you've got and My Chef will cook up a recipe around it.
        </p>

        {loading ? (
          <div className="kitchen-loading">
            <span className="kitchen-loading__spinner" aria-hidden="true" />
            <p>Cooking up your recipe...</p>
          </div>
        ) : recipe ? (
          <div className="kitchen-result">
            <FormMessage tone="success">Your recipe is ready!</FormMessage>
            <h2 className="kitchen-result__name">{recipe.name}</h2>
            <p className="kitchen-result__body">{recipe.recipe}</p>
            <Button variant="secondary" onClick={handleCookAnother}>
              Cook something else
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="kitchen-form">
            <FormMessage tone="error">{error}</FormMessage>
            <label className="kitchen-form__label" htmlFor="ingredients">
              Ingredients
            </label>
            <textarea
              id="ingredients"
              className="kitchen-form__textarea"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="e.g. chicken breast, garlic, spinach, lemon"
              rows={4}
            />
            <Button type="submit">Cook</Button>
          </form>
        )}
      </div>
    </div>
  );
}
