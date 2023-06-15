import { ReactElement } from "react";
import { Conversation, useConversations } from "../model/db";
import { useClient } from "../hooks/useClient";
import { Link } from "react-router-dom";
import { shortAddress } from "../util/shortAddress";

function ConversationCellView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-blue-700">{shortAddress(conversation.title)}</span>{" "}
      <span className="text-xs text-zinc-600 font-bold bg-zinc-200 rounded p-0.5">
        {conversation.isGroup ? "Group Chat" : "1:1"}
      </span>
    </div>
  );
}

export default function ConversationListView(): ReactElement {
  const client = useClient();
  const conversations = useConversations(client);

  return (
    <div>
      {conversations?.length == 0 && <p>No conversations yet.</p>}
      {conversations
        ? conversations.map((conversation) => (
            <Link to={`c/${conversation.topic}`} key={conversation.topic}>
              <ConversationCellView conversation={conversation} />
            </Link>
          ))
        : "Could not load conversations"}
    </div>
  );
}
