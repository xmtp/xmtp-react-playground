import { Conversation } from "../model/db";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../model/db";

// Keeps a conversation up to date with DB updates
export function useLiveConversation(conversation: Conversation): Conversation {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useLiveQuery(async () => {
    return db.conversations.where("topic").equals(conversation.topic).first();
  })!;
}
