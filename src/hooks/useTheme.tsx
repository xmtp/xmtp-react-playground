import { useContext } from "react";
import { UIContext } from "../contexts/UIContext";

export function useTheme() {
  return useContext(UIContext).theme;
}

export function useSetTheme() {
  const setTheme = useContext(UIContext).setTheme;
  const theme = useContext(UIContext).theme;
  const newTheme = theme == "dark" ? "light" : "dark";

  return () => {
    const root = window.document.documentElement;
    root.classList.remove(theme);
    setTheme(newTheme);
    root.classList.add(newTheme);
  };
}
