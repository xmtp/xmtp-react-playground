import * as XMTP from "@xmtp/xmtp-js";
import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useClient } from "../hooks/useClient";
import {
  Attachment,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";
import { Mutex } from "async-mutex";

const messageMutex = new Mutex();
const conversationMutex = new Mutex();

export interface Conversation {
  id?: number;
  topic: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  isGroup: boolean;
  groupMembers?: string[] | undefined;
}

export interface Message {
  id?: number;
  conversationTopic: string;
  xmtpID: string;
  senderAddress: string;
  sentByMe: boolean;
  sentAt: Date;
  text: string;
  contentType: XMTP.ContentTypeId;
  isSending: boolean;
}

export interface MessageAttachment {
  id?: number;
  messageID: number;
  filename: string;
  mimeType: string;
  data: Uint8Array;
}

class DB extends Dexie {
  conversations!: Dexie.Table<Conversation, number>;
  messages!: Dexie.Table<Message, number>;
  attachments!: Dexie.Table<MessageAttachment, number>;

  constructor() {
    super("DB");
    this.version(1).stores({
      conversations: `
        ++id,
        topic,
        title,
        createdAt,
        updatedAt,
        isGroup,
        groupMembers
        `,
      messages: `
        ++id,
        conversationTopic,
        xmtpID,
        senderAddress,
        sentByMe,
        sentAt,
        text,
        contentType
        `,
      attachments: `
        ++id,
        messageID,
        filename,
        mimeType,
        data
      `,
    });
  }
}

const db = new DB();

function clean(conversationTopic: string): string {
  return conversationTopic.replace("/xmtp/0/", "").replace("/proto", "");
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

    if (conversation.isGroup) {
      const groupMembers = (
        xmtpConversation.context?.metadata.initialMembers || ""
      ).split(",");

      if (groupMembers.length > 1) {
        conversation.groupMembers = groupMembers;
      } else {
        throw new Error("group conversation does not have members");
      }
    }

    conversation.id = await db.conversations.add(conversation);

    return conversation;
  });
}

export async function findConversation(
  topic: string
): Promise<Conversation | undefined> {
  return await db.conversations.where("topic").equals(clean(topic)).first();
}

export function useConversations(
  client: XMTP.Client | null
): Conversation[] | undefined {
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

  return useLiveQuery(async () => {
    return await db.conversations.toArray();
  });
}

export function useAttachment(message: Message): MessageAttachment | undefined {
  return useLiveQuery(async () => {
    return await db.attachments.where("messageID").equals(message.id!).first();
  });
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

      for await (const message of await xmtpConversation.streamMessages()) {
        await saveMessage(client, message);
      }
    })();
  }, []);

  return useLiveQuery(async () => {
    return await db.messages
      .where("conversationTopic")
      .equals(conversation.topic)
      .sortBy("sentAt");
  });
}
