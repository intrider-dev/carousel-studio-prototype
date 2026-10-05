import { useEffect } from "react";

export function useInputMode() {
  useEffect(() => {
    const pointer = () => {
      document.documentElement.dataset.inputMode = "pointer";
    };
    const keyboard = () => {
      document.documentElement.dataset.inputMode = "keyboard";
    };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);
}
