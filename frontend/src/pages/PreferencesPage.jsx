import { useState } from "react";
import logo from "../assets/logo.jpg";
import Button from "../components/Button";
import PreferencesForm from "../components/PreferencesForm";
import UserMenu from "../components/UserMenu";
import "./PreferencesPage.css";
import "../components/forms.css";

export default function PreferencesPage({ onContinue }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="preferences-page">
      <UserMenu />

      <div className="preferences-card">
        <img className="preferences-card__logo" src={logo} alt="My Chef logo" />
        <h1 className="preferences-card__title">Your preferences</h1>
        <p className="preferences-card__text">
          Tell us your diet type and allergies so recipes fit you. Saved once — no retyping next
          time, just come back here to change them.
        </p>

        <PreferencesForm onStatusChange={setSaved} />

        {saved ? (
          <Button className="preferences-continue" onClick={onContinue}>
            Continue to kitchen
          </Button>
        ) : null}
      </div>
    </div>
  );
}
