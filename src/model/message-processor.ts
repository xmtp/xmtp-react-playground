import db, { Conversation, Message, MessageAttachment } from "./db";
import * as XMTP from "@xmtp/xmtp-js";
import {
  Attachment,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { deleteReaction, persistReaction } from "./reactions";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { ContentTypeReadReceipt } from "@xmtp/content-type-read-receipt";
import { ContentTypeId } from "@xmtp/xmtp-js";

export async function process(
  client: XMTP.Client,
  conversation: Conversation,
  {
    content,
    contentType,
    message,
  }: { content: any; contentType: ContentTypeId; message: Message }
) {
  if (ContentTypeReadReceipt.sameAs(contentType)) {
    // Get items from the read receipts table based on peerAddress within conversation
    await db.readReceipts
      .get({ peerAddress: conversation.peerAddress })
      .then(async (existingEntry) => {
        // If the entry doesn't exist, add it with content timestamp
        if (!existingEntry) {
          await db.readReceipts.add({
            peerAddress: conversation.peerAddress,
            timestamp: message.content.timestamp,
          });
        }
        // If the entry does exist, update it with content timestamp
        else {
          await db.readReceipts.update(conversation.peerAddress, {
            timestamp: message.content.timestamp,
          });
        }
      });
  } else {
    message.id = await db.messages.add(message);

    if (ContentTypeReply.sameAs(contentType)) {
      const reply = content as Reply;
      await db.messages.update(message.id, {
        inReplyToID: reply.reference,
      });
    }

    if (ContentTypeAttachment.sameAs(contentType)) {
      const attachment = content as Attachment;
      const messageAttachment: MessageAttachment = {
        messageID: message.id,
        ...attachment,
      };

      await db.attachments.add(messageAttachment);
    }

    if (ContentTypeRemoteAttachment.sameAs(contentType)) {
      const remoteAttachment = content as RemoteAttachment;
      const attachment: Attachment = await RemoteAttachmentCodec.load(
        remoteAttachment,
        client
      );

      const messageAttachment: MessageAttachment = {
        messageID: message.id,
        ...attachment,
      };

      await db.attachments.add(messageAttachment);
    }

    if (ContentTypeReaction.sameAs(message.contentType as XMTP.ContentTypeId)) {
      const reaction: Reaction = message.content;

      if (reaction.action == "removed") {
        await deleteReaction({
          messageXMTPID: reaction.reference,
          reactor: message.senderAddress,
          name: reaction.content,
        });
      } else {
        await persistReaction({
          reactor: message.senderAddress,
          name: reaction.content,
          messageXMTPID: reaction.reference,
        });
      }
    }
  }
}
