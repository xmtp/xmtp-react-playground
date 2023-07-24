import db, { Conversation } from "../model/db";
import { useClient } from "./useClient";
import { sendMessage } from "../model/messages";
import { Client } from "@xmtp/xmtp-js";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { useLiveQuery } from "dexie-react-hooks";
import { useMessages } from "./useMessages";

export function useReadReceipts(conversation: Conversation) {
  const client = useClient();
  const messages = useMessages(conversation) || [];

  const isMostRecentMessageFromSelf = messages[messages.length - 1]?.sentByMe;
  const lastMessageTimestamp = messages[messages.length - 1]?.sentAt;

  const readReceiptsEnabled =
    window.localStorage.getItem("readReceiptsEnabled") === "true";

  return useLiveQuery(async () => {
    try {
      const lastReadReceiptMessage = await db.readReceipts.get({
        peerAddress: conversation.peerAddress,
      });
      const isMostRecentMessageReadReceipt =
        lastMessageTimestamp <
        new Date(lastReadReceiptMessage?.timestamp as string);

      if (isMostRecentMessageFromSelf && isMostRecentMessageReadReceipt) {
        return true;
      } else if (
        isMostRecentMessageFromSelf === false &&
        isMostRecentMessageReadReceipt === false &&
        readReceiptsEnabled
      ) {
        void sendMessage(
          client as Client,
          conversation,
          {
            timestamp: new Date().toISOString(),
          },
          ContentTypeReadReceipt
        );
        return false;
      } else {
        return false;
      }
    } catch {
      console.error("Error sending read receipt");
    }
  }, [messages]);
}
