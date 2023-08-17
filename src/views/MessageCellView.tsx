import { ReactElement } from "react";
import { Message, MessageAttachment } from "../model/db";
import { useAttachment } from "../hooks/useAttachment";
import { shortAddress } from "../util/shortAddress";
import { ContentTypeId, ContentTypeText } from "@xmtp/xmtp-js";
import {
  ContentTypeAttachment,
  ContentTypeRemoteAttachment,
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import MessageRepliesView from "./MessageRepliesView";
import ReactionsView from "./ReactionsView";
import ReadReceiptView from "./ReadReceiptView";

function ImageAttachmentContent({
  attachment,
}: {
  attachment: MessageAttachment;
}): ReactElement {
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

function AttachmentContent({ message }: { message: Message }): ReactElement {
  const attachment = useAttachment(message);

  if (!attachment) {
    return <span className="text-zinc-500">Loading attachment…</span>;
  }

  if (attachment.mimeType.startsWith("image/")) {
    return <ImageAttachmentContent attachment={attachment} />;
  }

  return (
    <span>
      {attachment.mimeType} {attachment.filename || "no filename?"}
    </span>
  );
}

export function Content({
  content,
  contentType,
}: {
  content: any;
  contentType: ContentTypeId;
}): ReactElement {
  if (ContentTypeText.sameAs(contentType)) {
    return <span>{content}</span>;
  }

  if (ContentTypeReply.sameAs(contentType)) {
    const reply: Reply = content;
    return <Content content={reply.content} contentType={reply.contentType} />;
  }

  return (
    <span className="text-zinc-500 break-all">
      Unknown content: {JSON.stringify(content)}
    </span>
  );
}

export function MessageContent({
  message,
}: {
  message: Message;
}): ReactElement {
  if (
    ContentTypeAttachment.sameAs(message.contentType as ContentTypeId) ||
    ContentTypeRemoteAttachment.sameAs(message.contentType as ContentTypeId)
  ) {
    return <AttachmentContent message={message} />;
  }

  return (
    <Content
      content={message.content}
      contentType={message.contentType as ContentTypeId}
    />
  );
}

export default function MessageCellView({
  message,
  readReceiptText,
}: {
  message: Message;
  readReceiptText: string | undefined;
}): ReactElement {
  return (
    <div className="flex">
      <span
        title={message.sentByMe ? "You" : message.senderAddress}
        className={message.sentByMe ? "text-zinc-500" : "text-green-500"}
      >
        {shortAddress(message.senderAddress)}:
      </span>
      <div className="ml-2">
        <MessageContent message={message} />
        <MessageRepliesView message={message} />
        <ReactionsView message={message} />
        <ReadReceiptView readReceiptText={readReceiptText} />
      </div>
    </div>
  );
}
