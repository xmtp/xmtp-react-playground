import db, { Message } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";

export function useReplies(message: Message): Message[] {
  return (
    useLiveQuery(async () => {
      return await db.messages
        .where("inReplyToID")
        .equals(message.xmtpID)
        .toArray();
    }) || []
  );
}
