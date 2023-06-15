import { useLoaderData } from "react-router-dom";
import ConversationView from "./ConversationView";
import { ReactElement } from "react";

export default function ConversationViewWithLoader(): ReactElement {
  const { conversation } = useLoaderData() as any;

  return <ConversationView conversation={conversation} />;
}
