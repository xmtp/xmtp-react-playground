import { ReactElement } from "react";
import { Message, MessageAttachment } from "../model/db";
import { useAttachment } from "../hooks/useAttachment";
import { shortAddress } from "../util/shortAddress";
import {
  ContentTypeGroupChatMemberAdded,
  ContentTypeGroupChatTitleChanged,
  ContentTypeId,
  ContentTypeText,
  GroupChatMemberAdded,
  GroupChatTitleChanged,
} from "@xmtp/xmtp-js";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "xmtp-content-type-remote-attachment";

function ImageAttachmentContent(attachment: MessageAttachment): ReactElement {
  const objectURL = URL.createObjectURL(
    new Blob([Buffer.from(attachment.data)], {
      type: attachment.mimeType,
    })
  );

  return (
    <img
      onLoad={() => {
        window.scroll({ top: 10000, behavior: "smooth" });
      }}
      className="rounded w-48"
      src={objectURL}
      title={attachment.filename}
    />
  );
}

function AttachmentContent(message: Message): ReactElement {
  const attachment = useAttachment(message);

  if (!attachment) {
    return <span className="text-zinc-500">Loading attachment…</span>;
  }

  if (attachment.mimeType.startsWith("image/")) {
    return ImageAttachmentContent(attachment);
  }

  return (
    <span>
      {attachment.mimeType} {attachment.filename || "no filename?"}
    </span>
  );
}

export function Content({ message }: { message: Message }): ReactElement {
  if (ContentTypeText.sameAs(message.contentType as ContentTypeId)) {
    return <span>{message.content}</span>;
  }

  if (
    ContentTypeAttachment.sameAs(message.contentType as ContentTypeId) ||
    ContentTypeRemoteAttachment.sameAs(message.contentType as ContentTypeId)
  ) {
    return AttachmentContent(message);
  }

  return (
    <span className="text-zinc-500">
      Unknown content: {JSON.stringify(message.content)}
    </span>
  );
}

export default function MessageCellView({
  message,
}: {
  message: Message;
}): ReactElement {
  if (
    ContentTypeGroupChatTitleChanged.sameAs(
      message.contentType as ContentTypeId
    )
  ) {
    const titleChanged: GroupChatTitleChanged = message.content;
    return (
      <div className="text-zinc-500 mb-1">
        {shortAddress(message.senderAddress)} changed the group title to{" "}
        <b>{titleChanged.newTitle}</b>
      </div>
    );
  }

  if (
    ContentTypeGroupChatMemberAdded.sameAs(message.contentType as ContentTypeId)
  ) {
    const memberAdded: GroupChatMemberAdded = message.content;
    return (
      <div className="text-zinc-500 mb-1">
        {shortAddress(message.senderAddress)} added <b>{memberAdded.member}</b>{" "}
        to the group
      </div>
    );
  }

  return (
    <div className="flex mb-1">
      <span
        title={message.sentByMe ? "You" : message.senderAddress}
        className={message.sentByMe ? "text-zinc-500" : "text-green-500"}
      >
        {shortAddress(message.senderAddress)}:
      </span>
      <div className="ml-2">
        <Content message={message} />
      </div>
    </div>
  );
}
