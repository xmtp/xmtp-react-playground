import { ReactElement, useEffect, useState } from "react";
import { useConversations } from "../hooks/useConversations";
import { useClient } from "../hooks/useClient";
import { Link } from "react-router-dom";
import { useLatestMessages } from "../hooks/useLatestMessages";
import ConversationCellView from "./ConversationCellView";

export default function ConversationListView(): ReactElement {
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(
    window.localStorage.getItem("readReceiptsEnabled") === "true"
  );

  const client = useClient();
  const conversations = useConversations(client);
  const latestMessages = useLatestMessages(conversations);

  useEffect(() => {
    window.localStorage.setItem(
      "readReceiptsEnabled",
      String(readReceiptsEnabled)
    );
  }, [readReceiptsEnabled]);

  return (
    <div>
      <button
        onClick={() => setReadReceiptsEnabled(!readReceiptsEnabled)}
        className="bg-blue-100 p-1 my-2 text-xs"
        id={`read-receipt-${readReceiptsEnabled}`}
      >
        {readReceiptsEnabled ? "Disable read receipts" : "Enable read receipts"}
      </button>
      {conversations?.length == 0 && <p>No conversations yet.</p>}
      {conversations
        ? conversations.map((conversation, i) => (
            // <Link to={`c/${conversation.topic}`} key={conversation.topic}>
            <ConversationCellView
              conversation={conversation}
              latestMessage={latestMessages[i]}
            />
            //{" "}
            // </Link>
          ))
        : "Could not load conversations"}
    </div>
  );
}
