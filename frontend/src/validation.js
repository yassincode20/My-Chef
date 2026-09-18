// Pure validation functions — no imports, so they're easy to unit test
// and easy for you to tweak if your backend's rules differ.

// Mirrors the backend's exact
//   USERNAME_REGEX = r"^[a-zA-Z0-9][a-zA-Z0-9._-]{2,19}$"
// First character must be a letter or digit; then 2-19 more characters
// from letters, digits, underscore, dot or hyphen. That caps total length
// at 3-20 characters.
const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,19}$/;

export function validateUsername(value) {
  const v = (value ?? "").trim();
  if (!v) return "Username is required";
  if (!USERNAME_REGEX.test(v)) {
    return "3-20 characters, start with a letter or number, then letters/numbers/._- only";
  }
  return "";
}

// Mirrors the backend's exact NAME_REGEX = r"^[a-zA-Z\s]+$" (letters and
// spaces only — no accents, hyphens or apostrophes), combined with its
// Field(min_length=2, max_length=30).
const NAME_REGEX = /^[a-zA-Z\s]+$/;

export function validateName(value) {
  const v = (value ?? "").trim();
  if (!v) return "Name is required";
  if (v.length < 2 || v.length > 30) {
    return "Name must be 2-30 characters";
  }
  if (!NAME_REGEX.test(v)) {
    return "Name can only contain letters and spaces";
  }
  return "";
}

export function validateEmail(value) {
  const v = (value ?? "").trim();
  if (!v) return "Email is required";
  // Standard, pragmatic email shape check (not a full RFC 5322 parser).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return "Enter a valid email address";
  }
  return "";
}

export function validatePassword(value) {
  const v = value ?? "";
  if (!v) return "Password is required";
  // Matches the backend's Field(min_length=8, max_length=30).
  if (v.length < 8) return "Password must be at least 8 characters";
  if (v.length > 30) return "Password must be 30 characters or fewer";
  if (!/[A-Z]/.test(v)) return "Add at least one capital letter";
  if (!/[a-z]/.test(v)) return "Add at least one lowercase letter";
  if (!/[0-9]/.test(v)) return "Add at least one number";
  if (!/[^A-Za-z0-9]/.test(v)) return "Add at least one special character";
  return "";
}

// Login's "login" field accepts either a username or an email, so it only
// needs to be non-empty — the backend decides which one it matches.
export function validateLoginIdentifier(value) {
  const v = (value ?? "").trim();
  if (!v) return "Enter your username or email";
  return "";
}

export function validateLoginPassword(value) {
  const v = value ?? "";
  if (!v) return "Password is required";
  return "";
}

// Preferences: I don't have usermodel.py's User_Prefrences field constraints
// (if it has any Field(...) rules at all), so this is just the min-3-chars
// rule you asked for. Tighten it once you share that model.
export function validateDietType(value) {
  const v = (value ?? "").trim();
  if (!v) return "Diet type is required";
  if (v.length < 3) return "Diet type must be at least 3 characters";
  return "";
}

export function validateAllergies(value) {
  const v = (value ?? "").trim();
  if (!v) return "Allergies is required";
  if (v.length < 3) return "Allergies must be at least 3 characters";
  return "";
}
