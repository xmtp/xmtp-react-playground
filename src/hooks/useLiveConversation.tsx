import { Conversation } from "@xmtp/models";
import { useLiveQuery } from "dexie-react-hooks";
import XMTPDB from "@xmtp/models";

// Keeps a conversation up to date with DB updates
export function useLiveConversation(conversation: Conversation): Conversation {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useLiveQuery(async () => {
    return XMTPDB.conversations
      .where("topic")
      .equals(conversation.topic)
      .first();
  })!;
}
