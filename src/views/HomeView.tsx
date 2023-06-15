import { ReactElement, useEffect, useState } from "react";
import ConversationListView from "./ConversationListView";
import { useClient } from "../hooks/useClient";
import { useConversation } from "../hooks/useConversation";
import ConversationView from "./ConversationView";
import { shortAddress } from "../util/shortAddress";

export default function HomeView(): ReactElement {
  const client = useClient()!;

  return (
    <div className="p-4">
      <small>
        Hi {shortAddress(client.address)}.<br />
        Here are your conversations:
      </small>
      <ConversationListView />
    </div>
  );
}
