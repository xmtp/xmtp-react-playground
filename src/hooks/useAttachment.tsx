import db, { Message, MessageAttachment } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";

export function useAttachment(message: Message): MessageAttachment | undefined {
  return useLiveQuery(async () => {
    return await db.attachments.where("messageID").equals(message.id!).first();
  });
}
