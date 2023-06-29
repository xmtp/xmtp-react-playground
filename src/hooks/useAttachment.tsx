import XMTPDB, { Message, MessageAttachment } from "@xmtp/models";
import { useLiveQuery } from "dexie-react-hooks";

export function useAttachment(message: Message): MessageAttachment | undefined {
  return useLiveQuery(async () => {
    return await XMTPDB.attachments
      .where("messageID")
      .equals(message.id!)
      .first();
  });
}
