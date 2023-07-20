import { Conversation, Message } from "../model/db";
import { useClient } from "./useClient";
import { useEffect, useState } from "react";
import { sendMessage } from "../model/messages";
import { Client } from "@xmtp/xmtp-js";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";

export function useReadReceipts(
  filteredMessages: Array<Message> | undefined,
  unfilteredMessages: Array<Message> | undefined,
  conversation: Conversation
): { showReadReceipt: boolean; readReceiptError: boolean } {
  const client = useClient();
  const [readReceiptError, setReadReceiptError] = useState(false);
  const [showReadReceipt, setShowReadReceipt] = useState(true);

  const isMostRecentMessageFromSelf =
    filteredMessages?.[filteredMessages.length - 1]?.senderAddress ===
    client?.address;

  const isMostRecentMessageReadReceipt =
    unfilteredMessages?.[unfilteredMessages.length - 1]?.contentType.typeId ===
    "readReceipt";

  useEffect(() => {
    setReadReceiptError(false);
    const enabledButton =
      window.localStorage.getItem("readReceiptsEnabled") === "true";
    if (
      isMostRecentMessageFromSelf &&
      isMostRecentMessageReadReceipt &&
      enabledButton
    ) {
      setShowReadReceipt(true);
    } else if (
      !isMostRecentMessageFromSelf &&
      !isMostRecentMessageReadReceipt
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
  }, [
    isMostRecentMessageFromSelf,
    isMostRecentMessageReadReceipt,
    showReadReceipt,
    conversation,
    client,
  ]);

  return {
    showReadReceipt,
    readReceiptError,
  };
}
