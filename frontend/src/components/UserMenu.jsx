import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.jpg";
import { useAuth } from "../context/AuthContext";
import "./UserMenu.css";

// Corner avatar that opens a small dropdown on hover (or click/tap, or
// keyboard) showing the signed-in name plus actions.
// onEditPreferences and onShowRecipes are both optional — omit whichever
// one would be redundant on the page this is rendered on (e.g. no
// "Edit preferences" on the Preferences page itself).
export default function UserMenu({ onEditPreferences, onShowRecipes }) {
  const { name, username, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    // A short grace period before closing, so moving the mouse across the
    // small gap between the avatar and the dropdown (or a stray pixel of
    // hover jitter) doesn't slam it shut before you can click anything.
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => {
    function handlePointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        cancelClose();
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        cancelClose();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      cancelClose();
    };
  }, []);

  return (
    <div
      className="user-menu"
      ref={rootRef}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => {
          cancelClose();
          setOpen((o) => !o);
        }}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <img className="user-menu__avatar" src={logo} alt="" />
      </button>

      {open ? (
        <div className="user-menu__dropdown" role="menu">
          <div className="user-menu__identity">
            <p className="user-menu__name">{name || "Chef"}</p>
            {username ? <p className="user-menu__username">@{username}</p> : null}
          </div>
          {onEditPreferences ? (
            <button
              type="button"
              className="user-menu__item"
              role="menuitem"
              onClick={() => {
                cancelClose();
                setOpen(false);
                onEditPreferences();
              }}
            >
              Edit preferences
            </button>
          ) : null}
          {onShowRecipes ? (
            <button
              type="button"
              className="user-menu__item"
              role="menuitem"
              onClick={() => {
                cancelClose();
                setOpen(false);
                onShowRecipes();
              }}
            >
              Recipe list
            </button>
          ) : null}
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            role="menuitem"
            onClick={logout}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
