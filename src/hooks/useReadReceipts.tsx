import db, { Conversation } from "../model/db";
import { useClient } from "./useClient";
import { useEffect, useState } from "react";
import { sendMessage } from "../model/messages";
import { Client } from "@xmtp/xmtp-js";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { useLiveQuery } from "dexie-react-hooks";
import { useMessages } from "./useMessages";

export function useReadReceipts(conversation: Conversation) {
  const client = useClient();
  const [readReceiptError, setReadReceiptError] = useState(false);
  const [showReadReceipt, setShowReadReceipt] = useState(true);
  const messages = useMessages(conversation) || [];

  const isMostRecentMessageFromSelf = messages[messages.length - 1]?.sentByMe;
  const lastMessageTimestamp = messages[messages.length - 1]?.sentAt;

  const readReceiptsEnabled =
    window.localStorage.getItem("readReceiptsEnabled") === "true";

  useEffect(() => {
    setShowReadReceipt(false);
  }, [messages]);

  useLiveQuery(async () => {
    setReadReceiptError(false);
    setShowReadReceipt(false);
    return await db.readReceipts
      .get({ peerAddress: conversation.peerAddress })
      .then(async (message) => {
        const isMostRecentMessageReadReceipt =
          lastMessageTimestamp < new Date(message?.timestamp as string);
        if (isMostRecentMessageFromSelf && isMostRecentMessageReadReceipt) {
          setShowReadReceipt(true);
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
        } else if (showReadReceipt) {
          setShowReadReceipt(false);
        }
      });
  }, [messages]);

  return {
    showReadReceipt,
    readReceiptError,
  };
}
