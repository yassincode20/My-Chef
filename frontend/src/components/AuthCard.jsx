import logo from "../assets/logo.jpg";
import "./AuthCard.css";

export default function AuthCard({ activeTab, onTabChange, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <img className="auth-card__logo" src={logo} alt="My Chef logo" />
          <h1 className="auth-card__title">My Chef</h1>
          <p className="auth-card__tagline">Cook smarter with a little AI help</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Login or register">
          <button
            type="button"
            role="tab"
            id="tab-login"
            aria-selected={activeTab === "login"}
            aria-controls="panel-login"
            className={`auth-tabs__btn${activeTab === "login" ? " auth-tabs__btn--active" : ""}`}
            onClick={() => onTabChange("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            id="tab-register"
            aria-selected={activeTab === "register"}
            aria-controls="panel-register"
            className={`auth-tabs__btn${activeTab === "register" ? " auth-tabs__btn--active" : ""}`}
            onClick={() => onTabChange("register")}
          >
            Register
          </button>
        </div>

        <div
          className="auth-card__body"
          role="tabpanel"
          id={activeTab === "login" ? "panel-login" : "panel-register"}
          aria-labelledby={activeTab === "login" ? "tab-login" : "tab-register"}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
