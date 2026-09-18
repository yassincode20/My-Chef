export default function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="field__toggle"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );
}
