import { useEffect } from "react";
import { useClient } from "./useClient";
import {} from "@xmtp/models";
import XMTPDB, { Conversation, Message, loadMessages } from "@xmtp/models";
import { useLiveQuery } from "dexie-react-hooks";

export function useMessages(conversation: Conversation): Message[] | undefined {
  const client = useClient();

  useEffect(() => {
    if (!client) return;
    loadMessages(conversation, client);
  });

  return useLiveQuery(async () => {
    return await XMTPDB.messages
      .where("conversationTopic")
      .equals(conversation.topic)
      .sortBy("sentAt");
  });
}
