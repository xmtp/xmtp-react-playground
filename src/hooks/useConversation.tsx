import { useContext } from "react";
import { ConversationContext } from "../contexts/ConversationContext";

export function useConversation() {
  return useContext(ConversationContext).conversation;
}

export function useSetConversation() {
  return useContext(ConversationContext).setConversation;
}
