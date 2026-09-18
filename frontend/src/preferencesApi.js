import { BASE, parseBody } from "./api";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Your /userprefrences endpoints reply with { "response": "..." } — except
// the POST failure branch, which has a typo and sends { "respone": "..." }
// (missing the second "s"). This checks both spellings so it doesn't break
// if that typo gets fixed later, or stays as-is.
function normalize(res, data) {
  if (res.status === 401) {
    return { ok: false, unauthorized: true, message: "Please log in again." };
  }
  if (res.status === 500) {
    // get_current_user's jwt.decode runs outside its try/except, so a
    // missing/expired/invalid token CAN surface as a 500 here — but so
    // can any other unrelated server-side bug. We can't tell which from
    // the response alone, so this no longer force-logs-out on every 500;
    // that was wrongly ejecting people over unrelated server errors.
    return {
      ok: false,
      message: "The server hit an error. If this keeps happening, try logging out and back in.",
    };
  }
  if (!res.ok) {
    return { ok: false, message: `Request failed (${res.status})` };
  }
  if (data && typeof data === "object") {
    const flag = data.response ?? data.respone;
    if (flag === "failed") {
      return { ok: false, message: "Could not save preferences." };
    }
  }
  return { ok: true, data };
}

// Fetches the signed-in user's saved preferences, if any exist yet.
export async function fetchPreferences(token) {
  const res = await fetch(`${BASE}/userprefrences`, {
    headers: authHeaders(token),
  });
  const data = await parseBody(res);
  const result = normalize(res, data);
  if (!result.ok) return result;

  if (data && typeof data === "object" && "diet_type" in data) {
    return { ok: true, exists: true, diet_type: data.diet_type, allergies: data.allergies };
  }
  // {"response": "failed"} (no row yet) lands here.
  return { ok: true, exists: false };
}

// First-time save.
export async function createPreferences(token, { diet_type, allergies }) {
  const res = await fetch(`${BASE}/userprefrences`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ diet_type, allergies }),
  });
  const data = await parseBody(res);
  return normalize(res, data);
}

// Edits an existing row — the backend's PUT only succeeds if one already
// exists (it looks it up and 404-equivalents to {"response":"failed"}
// otherwise), so always call createPreferences first, then this later.
export async function updatePreferences(token, { diet_type, allergies }) {
  const res = await fetch(`${BASE}/userprefrences`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify({ diet_type, allergies }),
  });
  const data = await parseBody(res);
  return normalize(res, data);
}
