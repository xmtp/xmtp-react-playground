import { ReactElement } from "react";
import { useConversations } from "../model/conversations";
import { useClient } from "../hooks/useClient";
import { Link } from "react-router-dom";
import { useLatestMessages } from "../model/messages";
import ConversationCellView from "./ConversationCellView";

export default function ConversationListView(): ReactElement {
  const client = useClient();
  const conversations = useConversations(client);
  const latestMesssages = useLatestMessages(conversations);

  return (
    <div>
      {conversations?.length == 0 && <p>No conversations yet.</p>}
      {conversations
        ? conversations.map((conversation, i) => (
            <Link to={`c/${conversation.topic}`} key={conversation.topic}>
              <ConversationCellView
                conversation={conversation}
                latestMessage={latestMesssages[i]}
              />
            </Link>
          ))
        : "Could not load conversations"}
    </div>
  );
}
