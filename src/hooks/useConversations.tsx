import { Conversation } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import { saveMessage } from "../model/messages";
import { saveConversation } from "../model/conversations";
import db from "../model/db";

export function useConversations(client: XMTP.Client | null): Conversation[] {
  useEffect(() => {
    (async () => {
      if (!client) return;

      for (const xmtpConversation of await client.conversations.list()) {
        const conversation = await saveConversation(xmtpConversation);

        // Load latest message from network for preview
        (async () => {
          const latestMessage = (
            await xmtpConversation.messages({
              direction: XMTP.SortDirection.SORT_DIRECTION_DESCENDING,
              limit: 1,
            })
          )[0];

          if (latestMessage) {
            await saveMessage(client, conversation, latestMessage);
          }
        })();
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!client) return;

      for await (const conversation of await client.conversations.stream()) {
        await saveConversation(conversation);
      }
    })();
  }, []);

  return (
    useLiveQuery(async () => {
      return await db.conversations.reverse().sortBy("updatedAt");
    }) || []
  );
}
