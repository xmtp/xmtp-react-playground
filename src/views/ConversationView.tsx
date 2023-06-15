import { ReactElement, useEffect } from "react";
import { Conversation, useMessages } from "../model/db";
import MessageComposerView from "./MessageComposerView";
import MessageCellView from "./MessageCellView";
import { useSetConversation } from "../hooks/useConversation";
import { Link } from "react-router-dom";

export default function ConversationView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  const messages = useMessages(conversation);
  const setConversation = useSetConversation();

  useEffect(() => {
    window.scrollTo({ top: 100000 });
  }, [messages?.length]);

  return (
    <div className="p-4 pb-20">
      <small className="text-sm bold">
        {conversation.title}{" "}
        <Link className="text-blue-600" to="/">
          Go Back
        </Link>
      </small>
      <div>
        {messages?.length == 0 && <p>No messages yet.</p>}
        {messages ? (
          messages.map((message) => (
            <MessageCellView key={message.xmtpID} message={message} />
          ))
        ) : (
          <span>Could not load messages</span>
        )}
      </div>
      <MessageComposerView conversation={conversation} />
    </div>
  );
}
