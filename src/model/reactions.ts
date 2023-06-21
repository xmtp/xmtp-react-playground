// xmtp.org/text
//

import {
  Client,
  ContentCodec,
  ContentTypeId,
  EncodedContent,
} from "@xmtp/xmtp-js";
import db, { Message, MessageReaction } from "./db";
import { findConversation, getXMTPConversation } from "./conversations";
import { Mutex } from "async-mutex";

const reactionMutex = new Mutex();

// This content type is used for a plain text content represented by a simple string
export const ContentTypeReaction = new ContentTypeId({
  authorityId: "xmtp.org",
  typeId: "reaction",
  versionMajor: 1,
  versionMinor: 0,
});

export type Reaction = {
  /**
   * The message ID for the message that is being reacted to
   */
  reference: string;
  /**
   * The action of the reaction
   */
  action: "added" | "removed";
  /**
   * The content of the reaction
   */
  content: string;
};

export type ReactionParameters = Pick<Reaction, "action" | "reference"> & {
  encoding: "UTF-8";
};

export class ReactionCodec implements ContentCodec<Reaction> {
  get contentType(): ContentTypeId {
    return ContentTypeReaction;
  }

  encode(content: Reaction): EncodedContent {
    return {
      type: ContentTypeReaction,
      parameters: {
        encoding: "UTF-8",
        action: content.action,
        reference: content.reference,
      },
      content: new TextEncoder().encode(content.content),
    };
  }

  decode(content: EncodedContent): Reaction {
    const encoding = content.parameters.encoding;
    if (encoding && encoding !== "UTF-8") {
      throw new Error(`unrecognized encoding ${encoding}`);
    }

    if (!["added", "removed"].includes(content.parameters.action)) {
      throw new Error("invalid action");
    }

    return {
      action: content.parameters.action as "added" | "removed",
      reference: content.parameters.reference,
      content: new TextDecoder().decode(content.content),
    };
  }
}

export async function addReaction(
  reactionName: string,
  message: Message,
  client: Client
) {
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
  };

  const xmtpConversation = await getXMTPConversation(client, conversation);
  await xmtpConversation.send(reaction, {
    contentType: ContentTypeReaction,
  });
}

export async function removeReaction(
  reactionName: string,
  message: Message,
  client: Client
) {
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
  };

  const xmtpConversation = await getXMTPConversation(client, conversation);
  await xmtpConversation.send(reaction, {
    contentType: ContentTypeReaction,
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
