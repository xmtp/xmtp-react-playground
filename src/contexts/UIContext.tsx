import { ReactElement, createContext, useState } from "react";
import { Conversation } from "../model/db";

type UIContextValue = {
  theme: string;
  setTheme: (theme: string) => void;
  activeView: string;
  setActiveView: (activeView: string) => void;
  activeChat: Conversation | null;
  setactiveChat: (activeChat: Conversation | null) => void;
};

export const UIContext = createContext<UIContextValue>({
  theme: "light",
  setTheme: () => {
    return;
  },
  activeView: "chat",
  setActiveView: () => {
    return;
  },
  activeChat: null,
  setactiveChat: () => {
    return;
  },
});

export default function UIProvider({
  children,
}: {
  children: ReactElement;
}): ReactElement {
  const [theme, setTheme] = useState<string>("light");
  const [activeView, setActiveView] = useState<string>("chat");
  const [activeChat, setactiveChat] = useState<Conversation | null>(null);
  const root = window.document.documentElement;
  root.classList.add(theme);

  const uiContextValue = {
    theme,
    setTheme,
    activeView,
    setActiveView,
    activeChat,
    setactiveChat,
  };

  return (
    <UIContext.Provider value={uiContextValue}>{children}</UIContext.Provider>
  );
}
