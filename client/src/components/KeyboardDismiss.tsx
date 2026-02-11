import React, { useState, useEffect } from "react";

export default function KeyboardDismiss() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        setVisible(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      setTimeout(() => {
        const active = document.activeElement;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT")
        ) {
          setVisible(false);
        }
      }, 100);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const dismissKeyboard = () => {
    const active = document.activeElement as HTMLElement;
    if (active) {
      active.blur();
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`keyboard-bar ${visible ? "visible" : ""}`}>
      <button onClick={dismissKeyboard} type="button">
        Done
      </button>
    </div>
  );
}
