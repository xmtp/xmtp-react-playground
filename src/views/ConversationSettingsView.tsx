import { ReactElement } from "react";
import { Conversation } from "../model/db";
import { XyzTransition } from "@animxyz/react";

export default function ConversationSettingsView({
  conversation,
}: {
  conversation: Conversation;
  dismiss: () => void;
}): ReactElement {
  return (
    <XyzTransition appear xyz="fade up-1 ease-out">
      <div className="mt-2 space-y-2">
        <h3>Conversation Info</h3>
        <p>This is a 1:1 conversation with {conversation.peerAddress}.</p>
      </div>
    </XyzTransition>
  );
}
