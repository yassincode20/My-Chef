import { useState } from "react";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import "../components/forms.css";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [notice, setNotice] = useState("");

  function handleTabChange(nextTab) {
    setNotice("");
    setTab(nextTab);
  }

  function handleRegisterSuccess(message) {
    setNotice(message);
    setTab("login");
  }

  return (
    <AuthCard activeTab={tab} onTabChange={handleTabChange}>
      <div key={tab} className="auth-panel-transition">
        {tab === "login" ? (
          <LoginForm
            notice={notice}
            onDismissNotice={() => setNotice("")}
            onSwitchToRegister={() => handleTabChange("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => handleTabChange("login")}
          />
        )}
      </div>
    </AuthCard>
  );
}
