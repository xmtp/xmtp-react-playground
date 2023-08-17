import { Conversation } from "./db";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import * as XMTP from "@xmtp/xmtp-js";
import db from "./db";
import { Mutex } from "async-mutex";
import { saveMessage } from "./messages";

// Prevent races when updating the local database
const conversationMutex = new Mutex();

// TODO: figure out better way to turn db Conversation -> XMTP.Conversation
export async function getXMTPConversation(
  client: XMTP.Client,
  conversation: Conversation
): Promise<XMTP.Conversation> {
  const conversations = await client.conversations.list();
  const xmtpConversation = conversations.find(
    (xmtpConversation) =>
      stripTopicName(xmtpConversation.topic) == conversation.topic
  );

  if (!xmtpConversation)
    throw new Error("could not convert db conversation to XMTP conversation");

  return xmtpConversation;
}

export async function findConversation(
  topic: string
): Promise<Conversation | undefined> {
  return await db.conversations
    .where("topic")
    .equals(stripTopicName(topic))
    .first();
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

export function stripTopicName(conversationTopic: string): string {
  return conversationTopic.replace("/xmtp/0/", "").replace("/proto", "");
}

export async function startConversation(
  client: XMTP.Client,
  address: string
): Promise<Conversation> {
  const xmtpConversation = await client.conversations.newConversation(address);
  return await saveConversation(xmtpConversation);
}

export async function saveConversation(
  xmtpConversation: XMTP.Conversation
): Promise<Conversation> {
  return await conversationMutex.runExclusive(async () => {
    const existing = await db.conversations
      .where("topic")
      .equals(stripTopicName(xmtpConversation.topic))
      .first();

    if (existing) {
      return existing;
    }

    const conversation: Conversation = {
      topic: stripTopicName(xmtpConversation.topic),
      title: undefined,
      createdAt: xmtpConversation.createdAt,
      updatedAt: xmtpConversation.createdAt,
      peerAddress: xmtpConversation.peerAddress,
    };

    conversation.id = await db.conversations.add(conversation);

    return conversation;
  });
}
