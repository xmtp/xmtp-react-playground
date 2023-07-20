import { ReactElement } from "react";
import { useConversations } from "../hooks/useConversations";
import { useClient } from "../hooks/useClient";
import { Link } from "react-router-dom";
import { useLatestMessages } from "../hooks/useLatestMessages";
import ConversationCellView from "./ConversationCellView";

export default function ConversationListView(): ReactElement {
  const client = useClient();
  const conversations = useConversations(client);
  const latestMessages = useLatestMessages(conversations);

  return (
    <div>
      {conversations?.length == 0 && <p>No conversations yet.</p>}
      {conversations
        ? conversations.map((conversation, i) => (
            <Link to={`c/${conversation.topic}`} key={conversation.topic}>
              <ConversationCellView
                conversation={conversation}
                latestMessage={latestMessages[i]}
              />
            </Link>
          ))
        : "Could not load conversations"}
    </div>
  );
}
