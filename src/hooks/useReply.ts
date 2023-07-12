import { Reply } from "@xmtp/content-type-reply";
import db, { Message } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";

export function useReply(message: Message) {
  return useLiveQuery(async () => {
    if (message.contentType.typeId !== "reply") {
      return undefined;
    }
    const reply = message.content as Reply;

    if (reply) {
      return await db.messages.where("xmtpID").equals(reply.reference).first();
    }
    return undefined;
  });
}
