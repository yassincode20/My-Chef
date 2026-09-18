import "./FormMessage.css";

export default function FormMessage({ tone = "error", children }) {
  if (!children) return null;
  return (
    <div className={`form-message form-message--${tone}`} role="alert" tabIndex={-1}>
      {children}
    </div>
  );
}
