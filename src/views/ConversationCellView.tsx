import { ReactElement } from "react";
import { Conversation, Message } from "../model/db";
import { shortAddress } from "../util/shortAddress";
import ReactTimeAgo from "react-time-ago";
import { MessageContent } from "./MessageCellView";

export default function ConversationCellView({
  conversation,
  latestMessage,
}: {
  conversation: Conversation;
  latestMessage: Message | undefined;
}): ReactElement {
  return (
    <div className="mt-2 p-2 border dark:border-zinc-600 rounded">
      <div className="flex items-center justify-between space-x-2">
        <div className="hover:underline">
          <span className="text-blue-700 dark:text-blue-500">
            {conversation.title || shortAddress(conversation.peerAddress)}
          </span>{" "}
        </div>
        <div className="text-xs text-zinc-500">
          <ReactTimeAgo date={conversation.updatedAt} />
        </div>
      </div>
      {latestMessage ? (
        <div className="block text-zinc-500">
          <MessageContent message={latestMessage} />
        </div>
      ) : (
        <div className="block text-zinc-500">No messages yet.</div>
      )}
    </div>
  );
}
