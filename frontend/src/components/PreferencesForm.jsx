import { useEffect, useState } from "react";
import Field from "./Field";
import Button from "./Button";
import FormMessage from "./FormMessage";
import { validateDietType, validateAllergies } from "../validation";
import { fetchPreferences, createPreferences, updatePreferences } from "../preferencesApi";
import { useAuth } from "../context/AuthContext";
import "./forms.css";

const initialValues = { diet_type: "", allergies: "" };

// onStatusChange(exists: boolean) lets the parent page know whether there's
// a saved row yet, so it can show/hide a "Continue to kitchen" button.
export default function PreferencesForm({ onStatusChange }) {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  // editing = the form is on screen (creating for the first time, or
  // reopened via "Edit"). When a saved row exists and editing is false,
  // we show a read-only summary instead of the raw inputs.
  const [editing, setEditing] = useState(true);
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validators = { diet_type: validateDietType, allergies: validateAllergies };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchPreferences(token);
      if (cancelled) return;
      if (result.unauthorized) {
        logout();
        return;
      }
      if (result.ok && result.exists) {
        const loaded = { diet_type: result.diet_type ?? "", allergies: result.allergies ?? "" };
        setValues(loaded);
        setSavedValues(loaded);
        setExists(true);
        setEditing(false);
        onStatusChange?.(true);
      } else {
        if (!result.ok) {
          // A real failure (e.g. server error), not just "no row yet" —
          // say so, otherwise this silently looks like an empty first-time
          // form and hides that something actually went wrong.
          setServerError(result.message || "Couldn't load your preferences, try again.");
        }
        onStatusChange?.(false);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, logout]);

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
      diet_type: validators.diet_type(values.diet_type),
      allergies: validators.allergies(values.allergies),
    };
    setErrors(nextErrors);
    setTouched({ diet_type: true, allergies: true });
    return Object.values(nextErrors).every((msg) => !msg);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    setSuccessMessage("");
    if (!validateAll()) return;

    setSubmitting(true);
    const save = exists ? updatePreferences : createPreferences;
    const result = await save(token, values);
    setSubmitting(false);

    if (result.unauthorized) {
      logout();
      return;
    }
    if (!result.ok) {
      setServerError(result.message || "Something went wrong, try again.");
      return;
    }
    setExists(true);
    setEditing(false);
    setSavedValues(values);
    setSuccessMessage(exists ? "Preferences updated." : "Preferences saved.");
    onStatusChange?.(true);
  }

  function handleEdit() {
    setServerError("");
    setSuccessMessage("");
    setEditing(true);
  }

  function handleCancel() {
    setServerError("");
    setValues(savedValues);
    setErrors({});
    setTouched({});
    setEditing(false);
  }

  if (loading) {
    return <p className="preferences-loading">Loading your preferences...</p>;
  }

  // Saved and not currently editing: show a read-only summary + Edit button.
  if (exists && !editing) {
    return (
      <div className="preferences-view">
        <FormMessage tone="success">{successMessage}</FormMessage>
        <dl className="preferences-view__list">
          <div className="preferences-view__row">
            <dt>Diet type</dt>
            <dd>{savedValues.diet_type}</dd>
          </div>
          <div className="preferences-view__row">
            <dt>Allergies</dt>
            <dd>{savedValues.allergies}</dd>
          </div>
        </dl>
        <Button variant="secondary" onClick={handleEdit}>
          Edit preferences
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="preferences-form">
      <FormMessage tone="error">{serverError}</FormMessage>

      <Field
        label="Diet type"
        value={values.diet_type}
        onChange={handleChange("diet_type")}
        onBlur={handleBlur("diet_type")}
        error={touched.diet_type ? errors.diet_type : ""}
        placeholder="e.g. vegetarian, keto, none"
      />
      <Field
        label="Allergies"
        value={values.allergies}
        onChange={handleChange("allergies")}
        onBlur={handleBlur("allergies")}
        error={touched.allergies ? errors.allergies : ""}
        placeholder="e.g. peanuts, shellfish, none"
      />

      <div className="preferences-form__actions">
        <Button type="submit" loading={submitting} fullWidth={false}>
          {exists ? "Save changes" : "Save preferences"}
        </Button>
        {exists ? (
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
