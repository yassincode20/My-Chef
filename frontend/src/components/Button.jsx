import "./Button.css";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  loading = false,
  onClick,
  fullWidth = true,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}${fullWidth ? " btn--full" : ""}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
      <span>{loading ? "Working..." : children}</span>
    </button>
  );
}
