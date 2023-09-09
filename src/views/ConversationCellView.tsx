import { ReactElement } from "react";
import { Conversation, Message } from "../model/db";
import { shortAddress } from "../util/shortAddress";
import ReactTimeAgo from "react-time-ago";
import { MessageContent } from "./MessageCellView";
import { useSetActiveChat } from "../hooks/useChat";

export default function ConversationCellView({
  conversation,
  latestMessage,
}: {
  conversation: Conversation;
  latestMessage: Message | undefined;
}): ReactElement {
  return (
    <div className="mt-2 p-2 border dark:border-zinc-600 rounded">
      <button onClick={useSetActiveChat(conversation)}>
        <div className="flex items-center justify-between space-x-2">
          <div className="hover:underline">
            <span className="text-blue-700 dark:text-blue-500">
              {conversation.title || shortAddress(conversation.peerAddress)}
            </span>{" "}
            <span className="text-xs text-zinc-600 font-bold dark:bg-zinc-800 bg-zinc-200 rounded p-0.5">
              {conversation.isGroup ? "Group Chat" : "1:1"}
            </span>
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
      </button>
    </div>
  );
}
