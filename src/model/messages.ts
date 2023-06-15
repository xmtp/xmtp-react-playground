import db, { Conversation, Message, MessageAttachment } from "./db";
import { getXMTPConversation, clean } from "./conversations";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
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

const messageMutex = new Mutex();

export function useLatestMessages(
  conversations: Conversation[]
): (Message | undefined)[] {
  const [latestMessages, setLatestMessages] = useState<(Message | undefined)[]>(
    []
  );

  return (
    useLiveQuery(async () => {
      return await Promise.all(
        conversations.map(async (conversation) => {
          return await db.messages
            .where("conversationTopic")
            .equals(conversation.topic)
            .limit(1)
            .reverse()
            .first();
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
    contentType: contentType,
    text: "",
    isSending: true,
  };

  if (contentType.sameAs(XMTP.ContentTypeText)) {
    message.text = content;
  }

  message.id = await db.messages.add(message);

  await persistAttachments(message.id, contentType, content, client);

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

async function saveMessage(
  client: XMTP.Client,
  decodedMessage: XMTP.DecodedMessage
): Promise<Message> {
  return await messageMutex.runExclusive(async () => {
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
      contentType: decodedMessage.contentType,
      text: "",
      isSending: false,
    };

    if (decodedMessage.contentType.sameAs(XMTP.ContentTypeText)) {
      message.text = decodedMessage.content;
    }

    message.id = await db.messages.add(message);

    await persistAttachments(
      message.id,
      decodedMessage.contentType,
      decodedMessage.content,
      client
    );

    return message;
  });
}

async function persistAttachments(
  messageID: number,
  contentType: XMTP.ContentTypeId,
  content: any,
  client: XMTP.Client
) {
  if (ContentTypeAttachment.sameAs(contentType)) {
    const attachment: Attachment = content;
    const messageAttachment: MessageAttachment = {
      messageID,
      ...attachment,
    };

    await db.attachments.add(messageAttachment);
  }

  if (ContentTypeRemoteAttachment.sameAs(contentType)) {
    const remoteAttachment: RemoteAttachment = content;
    const attachment: Attachment = await RemoteAttachmentCodec.load(
      remoteAttachment,
      client
    );

    const messageAttachment: MessageAttachment = {
      messageID,
      ...attachment,
    };

    await db.attachments.add(messageAttachment);
  }
}

export function useMessages(conversation: Conversation): Message[] | undefined {
  const client = useClient()!;

  useEffect(() => {
    (async () => {
      const xmtpConversation = await getXMTPConversation(client, conversation);
      for (const message of await xmtpConversation.messages()) {
        saveMessage(client, message);
      }

      const latestMessage = (
        await db.messages
          .where("conversationTopic")
          .equals(conversation.topic)
          .limit(1)
          .reverse()
          .sortBy("sentAt")
      )[0];

      if (latestMessage) {
        await db.conversations.update(conversation, {
          updatedAt: latestMessage.sentAt,
        });
      }

      for await (const message of await xmtpConversation.streamMessages()) {
        await saveMessage(client, message);
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
