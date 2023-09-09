import { useContext, useEffect } from "react";
import { useClient } from "./useClient";
import { loadMessages } from "../model/messages";
import db, { Conversation, Message } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";
import { UIContext } from "../contexts/UIContext";

export function useMessages(conversation: Conversation): Message[] | undefined {
  const client = useClient();

  useEffect(() => {
    if (!client) return;
    loadMessages(conversation, client); //load messages from xmtp server
  }, [client, conversation]);

  const msgs = useLiveQuery(
    async () =>
      db.messages
        .where({
          conversationTopic: conversation.topic,
          inReplyToID: "",
        })
        .sortBy("sentAt"),
    [conversation]
  );
  return msgs;
}
