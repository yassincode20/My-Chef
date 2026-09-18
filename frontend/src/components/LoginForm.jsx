import { useRef, useState } from "react";
import Field from "./Field";
import Button from "./Button";
import FormMessage from "./FormMessage";
import PasswordToggle from "./PasswordToggle";
import { loginUser } from "../api";
import { validateLoginIdentifier, validateLoginPassword } from "../validation";
import { useAuth } from "../context/AuthContext";

const initialValues = { login: "", password: "" };

export default function LoginForm({ onSwitchToRegister, notice, onDismissNotice }) {
  const { login } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const messageRef = useRef(null);

  const validators = {
    login: validateLoginIdentifier,
    password: validateLoginPassword,
  };

  function handleChange(field) {
    return (e) => {
      const value = e.target.value;
      setValues((v) => ({ ...v, [field]: value }));
      if (touched[field]) {
        setErrors((err) => ({ ...err, [field]: validators[field](value) }));
      }
    };
  }

  function handleBlur(field) {
    return () => {
      setTouched((t) => ({ ...t, [field]: true }));
      setErrors((err) => ({ ...err, [field]: validators[field](values[field]) }));
    };
  }

  function validateAll() {
    const nextErrors = {
      login: validators.login(values.login),
      password: validators.password(values.password),
    };
    setErrors(nextErrors);
    setTouched({ login: true, password: true });
    return Object.values(nextErrors).every((msg) => !msg);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    onDismissNotice?.();
    if (!validateAll()) {
      messageRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const result = await loginUser(values);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message || "Something went wrong, try again.");
      return;
    }
    if (result.token) {
      // Passing along whatever identifier they typed as a display name —
      // see the note in AuthContext.jsx on why (no backend endpoint
      // returns the real profile name).
      login(result.token, values.login.trim());
    } else if (result.alreadyLoggedIn) {
      // Backend recognized an existing valid token for this user; there's
      // no fresh token to store, so just leave the current session as-is.
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div ref={messageRef}>
        <FormMessage tone="success">{notice}</FormMessage>
        <FormMessage tone="error">{serverError}</FormMessage>
      </div>

      <Field
        label="Username or email"
        value={values.login}
        onChange={handleChange("login")}
        onBlur={handleBlur("login")}
        error={touched.login ? errors.login : ""}
        autoComplete="username"
        placeholder="your_username or you@example.com"
      />
      <Field
        label="Password"
        type={showPassword ? "text" : "password"}
        value={values.password}
        onChange={handleChange("password")}
        onBlur={handleBlur("password")}
        error={touched.password ? errors.password : ""}
        autoComplete="current-password"
        placeholder="Your password"
        rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
      />

      <Button type="submit" loading={submitting}>
        Log in
      </Button>

      <p className="auth-switch">
        New here?{" "}
        <button type="button" className="auth-switch__link" onClick={onSwitchToRegister}>
          Create an account
        </button>
      </p>
    </form>
  );
}
