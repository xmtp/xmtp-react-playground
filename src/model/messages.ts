import db, { Conversation, Message, MessageAttachment } from "./db";
import {
  getXMTPConversation,
  clean,
  updateConversationTimestamp,
} from "./conversations";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useClient } from "../hooks/useClient";
import * as XMTP from "@xmtp/xmtp-js";
import {
  Attachment,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";
import { Mutex } from "async-mutex";
import { upload } from "./attachments";
import { process } from "./message-processor";

const messageMutex = new Mutex();

export function useLatestMessages(
  conversations: Conversation[]
): (Message | undefined)[] {
  return (
    useLiveQuery(async () => {
      return await Promise.all(
        conversations.map(async (conversation) => {
          return (
            await db.messages
              .where("conversationTopic")
              .equals(conversation.topic)
              .reverse()
              .sortBy("sentAt")
          )[0];
        })
      );
    }, [
      conversations
        .map((conversation) => String(conversation.updatedAt))
        .join(),
    ]) || []
  );
}

export async function sendMessage(
  client: XMTP.Client,
  conversation: Conversation,
  content: any,
  contentType: XMTP.ContentTypeId
): Promise<Message> {
  const message: Message = {
    conversationTopic: clean(conversation.topic),
    xmtpID: "PENDING-" + new Date().toString(),
    senderAddress: client.address,
    sentByMe: true,
    sentAt: new Date(),
    contentType: { ...contentType },
    content: content,
    isSending: true,
  };

  message.id = await db.messages.add(message);

  await process(client, conversation, message);

  // Always treat Attachments as remote attachments so we don't send
  // huge messages to the network
  if (contentType.sameAs(ContentTypeAttachment)) {
    content = await upload(content);
    contentType = ContentTypeRemoteAttachment;
  }

  // Do the actual sending async
  (async () => {
    const xmtpConversation = await getXMTPConversation(client, conversation);
    const decodedMessage = await xmtpConversation.send(content, {
      contentType: contentType,
    });

    await db.messages.update(message.id!, {
      xmtpID: decodedMessage.id,
      sentAt: decodedMessage.sent,
      isSending: false,
    });
  })();

  return message;
}

async function nonMutex<T>(fn: () => Promise<T>) {
  return await fn();
}

export async function saveMessage(
  client: XMTP.Client,
  conversation: Conversation,
  decodedMessage: XMTP.DecodedMessage,
  useMutex = true
): Promise<Message> {
  const runner = useMutex
    ? messageMutex.runExclusive.bind(messageMutex)
    : nonMutex;

  return await runner(async () => {
    const existing = await db.messages
      .where("xmtpID")
      .equals(decodedMessage.id)
      .first();

    if (existing) {
      return existing;
    }

    const message: Message = {
      conversationTopic: clean(decodedMessage.contentTopic),
      xmtpID: decodedMessage.id,
      senderAddress: decodedMessage.senderAddress,
      sentByMe: decodedMessage.senderAddress == client.address,
      sentAt: decodedMessage.sent,
      contentType: { ...decodedMessage.contentType },
      content: decodedMessage.content,
      isSending: false,
    };

    message.id = await db.messages.add(message);

    await process(client, conversation, message);

    await updateConversationTimestamp(
      message.conversationTopic,
      message.sentAt
    );

    return message;
  });
}

export function useMessages(conversation: Conversation): Message[] | undefined {
  const client = useClient();

  useEffect(() => {
    if (!client) return;
    (async () => {
      const xmtpConversation = await getXMTPConversation(client, conversation);
      for (const message of await xmtpConversation.messages()) {
        saveMessage(client, conversation, message, false);
      }

      for await (const message of await xmtpConversation.streamMessages()) {
        await saveMessage(client, conversation, message);
      }
    })();
  });

  return useLiveQuery(async () => {
    return await db.messages
      .where("conversationTopic")
      .equals(conversation.topic)
      .sortBy("sentAt");
  });
}
