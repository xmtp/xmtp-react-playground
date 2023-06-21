import db, { Conversation, Message, MessageAttachment } from "./db";
import * as XMTP from "@xmtp/xmtp-js";
import {
  Attachment,
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
  RemoteAttachment,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";
import {
  ContentTypeReaction,
  Reaction,
  deleteReaction,
  persistReaction,
  removeReaction,
} from "./reactions";

export async function process(
  client: XMTP.Client,
  conversation: Conversation,
  message: Message
) {
  if (ContentTypeAttachment.sameAs(message.contentType as XMTP.ContentTypeId)) {
    const attachment: Attachment = message.content;
    const messageAttachment: MessageAttachment = {
      messageID: message.id!,
      ...attachment,
    };

    await db.attachments.add(messageAttachment);
  }

  if (
    ContentTypeRemoteAttachment.sameAs(
      message.contentType as XMTP.ContentTypeId
    )
  ) {
    const remoteAttachment: RemoteAttachment = message.content;
    const attachment: Attachment = await RemoteAttachmentCodec.load(
      remoteAttachment,
      client
    );

    const messageAttachment: MessageAttachment = {
      messageID: message.id!,
      ...attachment,
    };

    await db.attachments.add(messageAttachment);
  }

  if (
    XMTP.ContentTypeGroupChatTitleChanged.sameAs(
      message.contentType as XMTP.ContentTypeId
    )
  ) {
    const titleChanged: XMTP.GroupChatTitleChanged = message.content;

    await db.conversations.update(conversation, {
      title: titleChanged.newTitle,
    });
  }

  if (
    XMTP.ContentTypeGroupChatMemberAdded.sameAs(
      message.contentType as XMTP.ContentTypeId
    )
  ) {
    const memberAdded: XMTP.GroupChatMemberAdded = message.content;

    const groupMembers = new Set(conversation.groupMembers);
    groupMembers.add(memberAdded.member);

    await db.conversations.update(conversation, {
      groupMembers: Array.from(groupMembers),
    });
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
