import db, { Message, MessageReaction } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";

export function useReactions(message: Message): MessageReaction[] | undefined {
  return useLiveQuery(async () => {
    return await db.reactions
      .where("messageXMTPID")
      .equals(message.xmtpID)
      .toArray();
  });
}
