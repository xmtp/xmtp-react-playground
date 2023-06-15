import { ReactElement, useEffect } from "react";
import { Conversation } from "../model/db";
import { useMessages } from "../model/messages";
import MessageComposerView from "./MessageComposerView";
import MessageCellView from "./MessageCellView";
import { Link } from "react-router-dom";
import Header from "../components/Header";

export default function ConversationView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  const messages = useMessages(conversation);

  useEffect(() => {
    window.scrollTo({ top: 100000, behavior: "smooth" });
  }, [messages?.length]);

  return (
    <div className="p-4 pb-20 pt-14">
      <Header>
        <div className="flex justify-between">
          <div>{conversation.title}</div>
          <Link className="text-blue-700" to="/">
            Go Back
          </Link>
        </div>
      </Header>
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
