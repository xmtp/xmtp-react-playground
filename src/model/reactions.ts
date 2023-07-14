import { Client, ContentTypeId, ContentTypeText } from "@xmtp/xmtp-js";
import db, { Message, MessageReaction } from "./db";
import { findConversation, getXMTPConversation } from "./conversations";
import { Mutex } from "async-mutex";
import { ContentTypeReaction, Reaction } from "@xmtp/content-type-reaction";
import { shortAddress } from "../util/shortAddress";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply } from "@xmtp/content-type-reply";

const reactionMutex = new Mutex();

const getReactionTo = (message: Message) => {
  let reactionTo = "";

  if (
    ContentTypeAttachment.sameAs(message.contentType as ContentTypeId) ||
    ContentTypeRemoteAttachment.sameAs(message.contentType as ContentTypeId)
  ) {
    reactionTo = "to an attachment ";
  }

  if (ContentTypeReply.sameAs(message.contentType as ContentTypeId)) {
    reactionTo = "to a reply ";
  }

  if (ContentTypeText.sameAs(message.contentType as ContentTypeId)) {
    reactionTo = `to "${message.content}" `;
  }

  return reactionTo;
};

export async function addReaction(
  reactionName: string,
  message: Message,
  client: Client | null
) {
  if (!client) {
    return;
  }

  const conversation = await findConversation(message.conversationTopic);
  if (!conversation) {
    return;
  }

  await persistReaction({
    reactor: client.address,
    name: reactionName,
    messageXMTPID: message.xmtpID,
  });

  const reaction: Reaction = {
    action: "added",
    reference: message.xmtpID,
    content: reactionName,
    schema: "shortcode",
  };

  const xmtpConversation = await getXMTPConversation(client, conversation);
  await xmtpConversation.send(reaction, {
    contentType: ContentTypeReaction,
    contentFallback: `${shortAddress(client.address)} reacted ${getReactionTo(
      message
    )}with ${reaction.content}`,
  });
}

export async function removeReaction(
  reactionName: string,
  message: Message,
  client: Client | null
) {
  if (!client) {
    return;
  }

  const conversation = await findConversation(message.conversationTopic);

  if (!conversation) {
    return;
  }

  const existing = await db.reactions
    .where({
      messageXMTPID: message.xmtpID,
      reactor: client.address,
      name: reactionName,
    })
    .first();

  if (existing && existing.id) {
    db.reactions.delete(existing.id);
  }

  const reaction: Reaction = {
    action: "removed",
    reference: message.xmtpID,
    content: reactionName,
    schema: "shortcode",
  };

  const xmtpConversation = await getXMTPConversation(client, conversation);
  await xmtpConversation.send(reaction, {
    contentType: ContentTypeReaction,
    contentFallback: `${shortAddress(client.address)} unreacted ${getReactionTo(
      message
    )}with ${reaction.content}`,
  });
}

export async function deleteReaction(reaction: MessageReaction) {
  await reactionMutex.runExclusive(async () => {
    await db.reactions
      .where({
        messageXMTPID: reaction.messageXMTPID,
        reactor: reaction.reactor,
        name: reaction.name,
      })
      .delete();
  });
}

export async function persistReaction(reaction: MessageReaction) {
  await reactionMutex.runExclusive(async () => {
    const existing = await db.reactions
      .where({
        messageXMTPID: reaction.messageXMTPID,
        reactor: reaction.reactor,
        name: reaction.name,
      })
      .first();

    if (existing) {
      return;
    }

    await db.reactions.add(reaction);
  });
}
