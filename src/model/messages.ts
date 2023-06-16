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
    text: "",
    isSending: true,
  };

  if (contentType.sameAs(XMTP.ContentTypeText)) {
    message.text = content;
  }

  message.id = await db.messages.add(message);

  await persistAttachments(message.id, contentType, content, client);
  await processConversationStateChanges(
    message.content,
    message.contentType as XMTP.ContentTypeId,
    conversation
  );

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

export async function saveMessage(
  client: XMTP.Client,
  conversation: Conversation,
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
      contentType: { ...decodedMessage.contentType },
      content: decodedMessage.content,
      text: "",
      isSending: false,
    };

    if (XMTP.ContentTypeText.sameAs(decodedMessage.contentType)) {
      message.text = decodedMessage.content;
    }

    message.id = await db.messages.add(message);

    await persistAttachments(
      message.id,
      decodedMessage.contentType,
      decodedMessage.content,
      client
    );

    await processConversationStateChanges(
      decodedMessage.content,
      decodedMessage.contentType,
      conversation
    );

    await updateConversationTimestamp(
      message.conversationTopic,
      message.sentAt
    );

    return message;
  });
}

async function processConversationStateChanges(
  content: any,
  contentType: XMTP.ContentTypeId,
  conversation: Conversation
) {
  if (XMTP.ContentTypeGroupChatTitleChanged.sameAs(contentType)) {
    const titleChanged: XMTP.GroupChatTitleChanged = content;

    await db.conversations.update(conversation, {
      title: titleChanged.newTitle,
    });
  }

  if (XMTP.ContentTypeGroupChatMemberAdded.sameAs(contentType)) {
    const memberAdded: XMTP.GroupChatMemberAdded = content;

    const groupMembers = new Set(conversation.groupMembers);
    groupMembers.add(memberAdded.member);

    await db.conversations.update(conversation, {
      groupMembers: Array.from(groupMembers),
    });
  }
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
        saveMessage(client, conversation, message);
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
