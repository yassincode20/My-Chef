import { useRef, useState } from "react";
import Field from "./Field";
import Button from "./Button";
import FormMessage from "./FormMessage";
import PasswordToggle from "./PasswordToggle";
import { registerUser } from "../api";
import {
  validateUsername,
  validateName,
  validateEmail,
  validatePassword,
} from "../validation";

const initialValues = { user_name: "", name: "", email: "", password: "" };

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const messageRef = useRef(null);

  const validators = {
    user_name: validateUsername,
    name: validateName,
    email: validateEmail,
    password: validatePassword,
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
    const nextErrors = {};
    for (const field of Object.keys(validators)) {
      nextErrors[field] = validators[field](values[field]);
    }
    setErrors(nextErrors);
    setTouched({ user_name: true, name: true, email: true, password: true });
    return Object.values(nextErrors).every((msg) => !msg);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validateAll()) {
      messageRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const result = await registerUser(values);
    setSubmitting(false);

    if (!result.ok) {
      setServerError(result.message || "Something went wrong, try again.");
      return;
    }
    setValues(initialValues);
    setTouched({});
    // Switching tabs unmounts this form immediately, so any local success
    // message here would be set and destroyed in the same render and never
    // actually be seen. Hand the message to the parent instead, which shows
    // it on the Login tab this switches to.
    onSuccess?.("You're registered! Log in below to continue.");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div ref={messageRef}>
        <FormMessage tone="error">{serverError}</FormMessage>
      </div>

      <Field
        label="Username"
        value={values.user_name}
        onChange={handleChange("user_name")}
        onBlur={handleBlur("user_name")}
        error={touched.user_name ? errors.user_name : ""}
        autoComplete="username"
        placeholder="your_username"
      />
      <Field
        label="Name"
        value={values.name}
        onChange={handleChange("name")}
        onBlur={handleBlur("name")}
        error={touched.name ? errors.name : ""}
        autoComplete="name"
        placeholder="Your name"
      />
      <Field
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange("email")}
        onBlur={handleBlur("email")}
        error={touched.email ? errors.email : ""}
        autoComplete="email"
        placeholder="you@example.com"
      />
      <Field
        label="Password"
        type={showPassword ? "text" : "password"}
        value={values.password}
        onChange={handleChange("password")}
        onBlur={handleBlur("password")}
        error={touched.password ? errors.password : ""}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        rightSlot={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
      />
      <p className="form-hint">
        Needs a capital letter, a lowercase letter, a number and a special character.
      </p>

      <Button type="submit" loading={submitting}>
        Create account
      </Button>

      <p className="auth-switch">
        Already cooking with us?{" "}
        <button type="button" className="auth-switch__link" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </form>
  );
}
