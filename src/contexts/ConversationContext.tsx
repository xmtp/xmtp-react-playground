import { createContext, useState, ReactElement } from "react";
import { Conversation } from "../model/db";

type ConversationContextValue = {
  conversation: Conversation | null;
  setConversation: (conversation: Conversation) => void;
};

export const ConversationContext = createContext<ConversationContextValue>({
  conversation: null,
  setConversation: (_: Conversation) => {
    return;
  },
});

export default function ConversationProvider({
  children,
}: {
  children: ReactElement;
}): ReactElement {
  const [conversation, setConversation] = useState<Conversation | null>(null);

  const conversationContextValue = {
    conversation,
    setConversation,
  };

  return (
    <ConversationContext.Provider value={conversationContextValue}>
      {children}
    </ConversationContext.Provider>
  );
}
