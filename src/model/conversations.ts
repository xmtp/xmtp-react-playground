import { Conversation } from "./db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import db from "./db";
import { Mutex } from "async-mutex";

const conversationMutex = new Mutex();

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

export function useConversations(client: XMTP.Client | null): Conversation[] {
  useEffect(() => {
    (async () => {
      if (!client) return;

      for (const conversation of await client.conversations.list()) {
        await saveConversation(conversation);
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
      title: xmtpConversation.peerAddress,
      createdAt: xmtpConversation.createdAt,
      updatedAt: xmtpConversation.createdAt,
      isGroup: xmtpConversation.isGroup,
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
