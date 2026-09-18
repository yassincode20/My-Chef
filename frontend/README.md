# My Chef — frontend

React + Vite frontend for the register/login system. This talks to your
FastAPI backend (`my-chef.py`) at `http://localhost:8000` through a dev
proxy, so you don't need to add CORS to the backend to get this running.

## Run it

You need Node.js installed (18+). Then, from this folder:

```bash
npm install
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173`. Open that in
your browser.

In a separate terminal, run your FastAPI backend as usual (e.g.
`uvicorn my_chef:app --reload`, adjusted to your actual filename), so it's
listening on `http://localhost:8000`. The frontend's `/api/...` calls get
forwarded there automatically by `vite.config.js`.

If your backend runs on a different port, edit the `target` in
`vite.config.js`.

## What's here

- `src/pages/AuthPage.jsx` — the login/register card with tabs
- `src/components/LoginForm.jsx`, `RegisterForm.jsx` — the two forms
- `src/validation.js` — all field validation, plain functions, easy to test
  or change without touching any component
- `src/api.js` — talks to `/register` and `/login`, and normalizes your
  backend's mixed 200-with-error-body responses into `{ ok, data, message }`
- `src/context/AuthContext.jsx` — holds the JWT in memory + localStorage,
  decides whether to show the auth page or the post-login placeholder
- `src/pages/KitchenPage.jsx` — placeholder "Welcome to the kitchen" screen
  shown after login, ready for preferences/recipes to replace it later

## Validation rules implemented

- **Username**: matches `USERNAME_REGEX = r"^[a-zA-Z0-9][a-zA-Z0-9._-]{2,19}$"`
  exactly — must start with a letter or number, 3-20 characters total,
  letters/numbers/`.`/`_`/`-` after that
- **Name**: matches `NAME_REGEX = r"^[a-zA-Z\s]+$"` and
  `Field(min_length=2, max_length=30)` exactly — letters and spaces only, no
  accents, hyphens or apostrophes (so "Anne-Marie" or "O'Brien" would be
  rejected by your backend too)
- **Email**: standard email shape check (backend uses `EmailStr`, which is
  stricter — Pydantic will catch anything this misses)
- **Password**: 8-30 characters (matches `Field(min_length=8, max_length=30)`),
  at least one capital letter, one lowercase letter, one number, and one
  special character
- **Login**: accepts either username or email (whatever you typed is sent
  as-is; the backend decides which it matches), password just can't be empty

All of these live in `src/validation.js` — change the regex/rules there if
your backend's actual rules differ.

## Known backend quirks this frontend works around

- `/register` and `/login` both return **HTTP 200** even on failure, with
  bodies like `{"error": "..."}` or a bare string (`"user not found due
  invalid data"`). `src/api.js` checks the body shape rather than the status
  code to tell success from failure.
- `get_current_user`'s `jwt.decode` runs outside its `try/except`, so an
  expired token currently causes a 500 instead of a 401 on protected routes.
  Not used by this login/register flow, but worth knowing before you wire up
  preferences.

## Not done yet (on purpose)

Preferences and recipes aren't built — after login you'll just see a
"Welcome to the kitchen" placeholder with a logout button, as agreed.
