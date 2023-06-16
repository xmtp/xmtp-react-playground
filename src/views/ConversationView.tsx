import { ReactElement, useEffect, useState } from "react";
import db, { Conversation } from "../model/db";
import { useMessages } from "../model/messages";
import MessageComposerView from "./MessageComposerView";
import MessageCellView from "./MessageCellView";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { useLiveConversation } from "../model/conversations";
import ConversationSettingsView from "./ConversationSettingsView";

export default function ConversationView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  const messages = useMessages(conversation);
  const liveConversation = useLiveConversation(conversation);
  const [isShowingSettings, setIsShowingSettings] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 100000, behavior: "smooth" });
  }, [messages?.length]);

  return (
    <div className="p-4 pb-20 pt-14">
      <Header>
        <div className="flex justify-between font-bold">
          <span className="flex-grow">
            {liveConversation?.title || conversation.peerAddress}
          </span>
          <div className="space-x-4">
            <button
              className="inline-block space-x-1 text-zinc-600"
              onClick={() => {
                setIsShowingSettings(!isShowingSettings);
              }}
            >
              <Cog6ToothIcon className="h-4 inline-block align-top" />
              <span>Settings</span>
            </button>
            <Link className="text-blue-700" to="/">
              Go Back
            </Link>
          </div>
        </div>
        {isShowingSettings && (
          <ConversationSettingsView
            conversation={conversation}
            dismiss={() => setIsShowingSettings(false)}
          />
        )}
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
