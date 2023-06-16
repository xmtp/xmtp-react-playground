import * as XMTP from "@xmtp/xmtp-js";
import Dexie from "dexie";

export interface Conversation {
  id?: number;
  topic: string;
  title: string | undefined;
  createdAt: Date;
  updatedAt: Date;
  isGroup: boolean;
  peerAddress: string;
  groupMembers?: string[] | undefined;
}

export interface Message {
  id?: number;
  conversationTopic: string;
  xmtpID: string;
  senderAddress: string;
  sentByMe: boolean;
  sentAt: Date;
  contentType: {
    authorityId: string;
    typeId: string;
    versionMajor: number;
    versionMinor: number;
  };
  content: any;
  metadata?: { [key: string]: [value: string] };
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
        groupMembers,
        peerAddress
        `,
      messages: `
        ++id,
        conversationTopic,
        xmtpID,
        senderAddress,
        sentByMe,
        sentAt,
        contentType,
        content
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
export default db;
