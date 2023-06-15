import { ReactElement } from "react";
import { Message, MessageAttachment } from "../model/db";
import { useAttachment } from "../model/attachments";
import { shortAddress } from "../util/shortAddress";
import { ContentTypeText } from "@xmtp/xmtp-js";
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
    <img className="rounded w-48" src={objectURL} title={attachment.filename} />
  );
}

function AttachmentContent(message: Message): ReactElement {
  const attachment = useAttachment(message);

  if (!attachment) {
    return <span className="text-zinc-500">No attachment found.</span>;
  }

  if (["image/png", "image/jpg", "image/gif"].includes(attachment.mimeType)) {
    return ImageAttachmentContent(attachment);
  }

  return <span>{attachment.filename || "no filename?"}</span>;
}

function Content({ message }: { message: Message }): ReactElement {
  if (ContentTypeText.sameAs(message.contentType)) {
    return <span>{message.text}</span>;
  }

  if (
    ContentTypeAttachment.sameAs(message.contentType) ||
    ContentTypeRemoteAttachment
  ) {
    return AttachmentContent(message);
  }

  return <span>Who knows</span>;
}

export default function MessageCellView({
  message,
}: {
  message: Message;
}): ReactElement {
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
