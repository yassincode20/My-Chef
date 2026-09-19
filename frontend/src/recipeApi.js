import { BASE, parseBody } from "./api";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// Your /recipe POST endpoint declares `ingredients: str` as a plain
// parameter with no Body(...)/Field(...) annotation — FastAPI treats that
// as a QUERY parameter, not a JSON body field. So this sends it as
// ?ingredients=... and no request body, not JSON.stringify'd.
export async function cookRecipe(token, ingredientsText) {
  const query = new URLSearchParams({ ingredients: ingredientsText }).toString();
  const res = await fetch(`${BASE}/recipe?${query}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await parseBody(res);

  if (res.status === 401) {
    return { ok: false, unauthorized: true, message: "Please log in again." };
  }
  if (res.status === 500) {
    // A 500 here could be the get_current_user token bug (expired/invalid
    // token raising an uncaught JWTError) OR a completely unrelated crash
    // in chef.cook()/the recipe save step. We can't tell which from the
    // response alone, so we no longer force a logout on every 500 — that
    // was wrongly kicking people out for server-side bugs that had nothing
    // to do with their session.
    return {
      ok: false,
      message:
        "chef might be busy now try again later.",
    };
  }
  if (!res.ok) {
    return { ok: false, message: `Request failed (${res.status})` };
  }
  if (typeof data === "string") {
    // The backend returns the plain string "error" when there's no saved
    // preferences row yet (chef.cook never gets called).
    return {
      ok: false,
      message: data === "error" ? "Save your diet preferences first, then try again." : data,
    };
  }
  if (Array.isArray(data) && data.length === 2) {
    const [name, recipeText] = data;
    return { ok: true, name, recipe: recipeText };
  }
  return { ok: false, message: "Unexpected response from the server." };
}

// GET /recipe returns an array of saved recipe rows, or []. Used by
// RecipeListPage. We don't have databasemodel.py's recipe_info columns, so
// RecipeListPage reads fields defensively (falls back gracefully if a
// field it expects — name/recipe/id — isn't actually there).
export async function fetchRecipeHistory(token) {
  const res = await fetch(`${BASE}/recipe`, { headers: authHeaders(token) });
  const data = await parseBody(res);

  if (res.status === 401) {
    return { ok: false, unauthorized: true, message: "Please log in again." };
  }
  if (!res.ok) {
    return { ok: false, message: `Request failed (${res.status})` };
  }
  return { ok: true, recipes: Array.isArray(data) ? data : [] };
}
