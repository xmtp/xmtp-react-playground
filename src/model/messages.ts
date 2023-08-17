import db, { Conversation, Message } from "./db";
import {
  getXMTPConversation,
  stripTopicName,
  updateConversationTimestamp,
} from "./conversations";
import * as XMTP from "@xmtp/xmtp-js";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { Mutex } from "async-mutex";
import { upload } from "./attachments";
import { process } from "./message-processor";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";

const messageMutex = new Mutex();

export async function sendMessage(
  client: XMTP.Client,
  conversation: Conversation,
  content: any,
  contentType: XMTP.ContentTypeId
): Promise<Message> {
  const message: Message = {
    conversationTopic: stripTopicName(conversation.topic),
    inReplyToID: "",
    xmtpID: "PENDING-" + new Date().toString(),
    senderAddress: client.address,
    sentByMe: true,
    sentAt: new Date(),
    contentType: { ...contentType },
    content: content,
    isSending: true,
  };

  await process(client, conversation, {
    content,
    contentType,
    message,
  });

  // process reply content as message
  if (contentType.sameAs(ContentTypeReply)) {
    const replyContent = content as Reply;
    await process(client, conversation, {
      content: replyContent.content,
      contentType: replyContent.contentType,
      message,
    });
  }

  // Do the actual sending async
  (async () => {
    // check if message is a reply that contains an attachment
    if (
      contentType.sameAs(ContentTypeReply) &&
      (content as Reply).contentType.sameAs(ContentTypeAttachment)
    ) {
      (content as Reply).content = await upload(content.content);
      (content as Reply).contentType = ContentTypeRemoteAttachment;
    } else {
      // Always treat Attachments as remote attachments so we don't send
      // huge messages to the network
      if (contentType.sameAs(ContentTypeAttachment)) {
        content = await upload(content);
        contentType = ContentTypeRemoteAttachment;
      }
    }

    const xmtpConversation = await getXMTPConversation(client, conversation);
    const decodedMessage = await xmtpConversation.send(content, {
      contentType,
    });

    if (message.contentType.typeId !== "readReceipt") {
      await db.messages.update(message.id!, {
        xmtpID: decodedMessage.id,
        sentAt: decodedMessage.sent,
        isSending: false,
      });
    }
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
      conversationTopic: stripTopicName(decodedMessage.contentTopic),
      inReplyToID: "",
      xmtpID: decodedMessage.id,
      senderAddress: decodedMessage.senderAddress,
      sentByMe: decodedMessage.senderAddress == client.address,
      sentAt: decodedMessage.sent,
      contentType: { ...decodedMessage.contentType },
      content: decodedMessage.content,
      isSending: false,
    };

    await process(client, conversation, {
      content: decodedMessage.content,
      contentType: decodedMessage.contentType,
      message,
    });

    // process reply content as message
    if (decodedMessage.contentType.sameAs(ContentTypeReply)) {
      const replyContent = decodedMessage.content as Reply;
      await process(client, conversation, {
        content: replyContent.content,
        contentType: replyContent.contentType,
        message,
      });
    }

    await updateConversationTimestamp(
      message.conversationTopic,
      message.sentAt
    );

    return message;
  });
}

export async function loadMessages(
  conversation: Conversation,
  client: XMTP.Client
) {
  const xmtpConversation = await getXMTPConversation(client, conversation);
  for (const message of await xmtpConversation.messages()) {
    saveMessage(client, conversation, message, true);
  }

  for await (const message of await xmtpConversation.streamMessages()) {
    await saveMessage(client, conversation, message);
  }
}
