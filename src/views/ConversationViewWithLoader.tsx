import { useLoaderData } from "react-router-dom";
import ConversationView from "./ConversationView";
import { ReactElement } from "react";
import { Conversation } from "../model/db";

export default function ConversationViewWithLoader(): ReactElement {
  const { conversation } = useLoaderData() as { conversation: Conversation };

  return <ConversationView conversation={conversation} />;
}
