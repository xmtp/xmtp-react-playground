import { useLoaderData } from "react-router-dom";
import ConversationView from "./ConversationView";
import { useSetConversation } from "../hooks/useConversation";
import { ReactElement, useEffect } from "react";

export default function ConversationViewWithLoader(): ReactElement {
  const { conversation } = useLoaderData() as any;
  const setConversation = useSetConversation();

  useEffect(() => {
    setConversation(conversation);
  }, []);

  return <ConversationView conversation={conversation} />;
}
