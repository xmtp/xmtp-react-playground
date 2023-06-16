import { Conversation } from "./db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import db from "./db";
import { Mutex } from "async-mutex";
import { saveMessage } from "./messages";

const conversationMutex = new Mutex();

// Keeps a conversation up to date with DB updates
export function useLiveConversation(conversation: Conversation): Conversation {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useLiveQuery(async () => {
    return db.conversations.where("topic").equals(conversation.topic).first();
  })!;
}

// TODO: figure out better way to turn db Conversation -> XMTP.Conversation
export async function getXMTPConversation(
  client: XMTP.Client,
  conversation: Conversation
): Promise<XMTP.Conversation> {
  const conversations = await client.conversations.list();
  const xmtpConversation = conversations.find(
    (xmtpConversation) => clean(xmtpConversation.topic) == conversation.topic
  );

  if (!xmtpConversation)
    throw new Error("could not convert db conversation to XMTP conversation");

  return xmtpConversation;
}

export async function findConversation(
  topic: string
): Promise<Conversation | undefined> {
  return await db.conversations.where("topic").equals(clean(topic)).first();
}

export async function updateConversationTimestamp(
  topic: string,
  updatedAt: Date
) {
  const conversation = await db.conversations
    .where("topic")
    .equals(topic)
    .first();

  if (conversation && conversation.updatedAt < updatedAt) {
    await conversationMutex.runExclusive(async () => {
      await db.conversations.update(conversation, { updatedAt });
    });
  }
}

export function useConversations(client: XMTP.Client | null): Conversation[] {
  useEffect(() => {
    (async () => {
      if (!client) return;

      for (const xmtpConversation of await client.conversations.list()) {
        const conversation = await saveConversation(xmtpConversation);

        // Load latest message from network for preview
        (async () => {
          const latestMessage = (
            await xmtpConversation.messages({
              direction: XMTP.SortDirection.SORT_DIRECTION_DESCENDING,
              limit: 1,
            })
          )[0];

          if (latestMessage) {
            await saveMessage(client, conversation, latestMessage);
          }
        })();
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!client) return;

      for await (const conversation of await client.conversations.stream()) {
        await saveConversation(conversation);
      }
    })();
  }, []);

  return (
    useLiveQuery(async () => {
      return await db.conversations.reverse().sortBy("updatedAt");
    }) || []
  );
}

export function clean(conversationTopic: string): string {
  return conversationTopic.replace("/xmtp/0/", "").replace("/proto", "");
}

export async function startConversation(
  client: XMTP.Client,
  address: string
): Promise<Conversation> {
  const xmtpConversation = await client.conversations.newConversation(address);
  return await saveConversation(xmtpConversation);
}

export async function startGroupConversation(
  client: XMTP.Client,
  addresses: string[]
): Promise<Conversation> {
  const xmtpConversation = await client.conversations.newGroupConversation(
    addresses
  );

  return await saveConversation(xmtpConversation);
}

export async function saveConversation(
  xmtpConversation: XMTP.Conversation
): Promise<Conversation> {
  return await conversationMutex.runExclusive(async () => {
    const existing = await db.conversations
      .where("topic")
      .equals(clean(xmtpConversation.topic))
      .first();

    if (existing) {
      return existing;
    }

    const conversation: Conversation = {
      topic: clean(xmtpConversation.topic),
      title: undefined,
      createdAt: xmtpConversation.createdAt,
      updatedAt: xmtpConversation.createdAt,
      isGroup: xmtpConversation.isGroup,
      peerAddress: xmtpConversation.peerAddress,
    };

    // TODO: Conversations streaming in don't have isGroup set properly
    const groupMembers = (
      xmtpConversation.context?.metadata.initialMembers || ""
    ).split(",");

    if (groupMembers.length > 1) {
      conversation.isGroup = true;
      conversation.groupMembers = groupMembers;
    } else {
      conversation.isGroup = false;
    }

    conversation.id = await db.conversations.add(conversation);

    return conversation;
  });
}
