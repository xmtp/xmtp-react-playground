import { ReactElement } from "react";
import { Conversation } from "../model/db";
import { XyzTransition } from "@animxyz/react";
// import GroupSettingsView from "./GroupSettingsView";

export default function ConversationSettingsView({
  conversation,
  dismiss,
}: {
  conversation: Conversation;
  dismiss: () => void;
}): ReactElement {
  const summary = conversation.isGroup ? (
    <p>This is a group conversation.</p>
  ) : (
    <p>This is a 1:1 conversation with {conversation.peerAddress}.</p>
  );

  return (
    <XyzTransition appear xyz="fade up-1 ease-out">
      <div className="mt-2 space-y-2">
        <h3>Conversation Info</h3>
        {summary}

        {/* {conversation.isGroup && (
          <GroupSettingsView conversation={conversation} dismiss={dismiss} />
        )} */}
      </div>
    </XyzTransition>
  );
}
