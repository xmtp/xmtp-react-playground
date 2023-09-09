import { useContext } from "react";
import { UIContext } from "../contexts/UIContext";
import { Conversation } from "../model/db";

export function useActiveChat() {
  return useContext(UIContext).activeChat;
}

export function useSetActiveChat(activeChat: Conversation) {
  const setactiveChat = useContext(UIContext).setactiveChat;

  return () => {
    setactiveChat(activeChat);
  };
}
