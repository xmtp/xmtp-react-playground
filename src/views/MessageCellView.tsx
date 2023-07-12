import { ReactElement, useCallback, useContext } from "react";
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
} from "@xmtp/content-type-remote-attachment";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { useReply } from "../hooks/useReply";
import Button from "../components/Button";
import { ReplyContext } from "../contexts/ReplyContext";

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

function ReplyContent({ message }: { message: Message }): ReactElement | null {
  const originalMessage = useReply(message);

  // this shouldn't happen, but guard against it anyway
  if (!originalMessage) {
    return null;
  }

  return (
    <>
      <div className="mb-2 opacity-50">
        <small>Reply to</small>
      </div>
      <div className="opacity-50 border rounded dark:bg-black dark:border-zinc-700 px-2 py-1 mb-2">
        {Content({
          message: {
            ...originalMessage,
            xmtpID: `${originalMessage.xmtpID}-${message.xmtpID}`,
          },
        })}
      </div>
      {Content({
        message: {
          ...message,
          content: (message.content as Reply).content,
          contentType: (message.content as Reply).contentType,
        },
      })}
    </>
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
    return <AttachmentContent message={message} />;
  }

  return (
    <span className="text-zinc-500 break-all">
      Unknown content: {JSON.stringify(message.content)}
    </span>
  );
}

export default function MessageCellView({
  message,
}: {
  message: Message;
}): ReactElement {
  const { setIsReplying } = useContext(ReplyContext);
  const handleReply = useCallback(
    (message: Message) => {
      setIsReplying(true, message);
    },
    [setIsReplying]
  );

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

  const isReply = ContentTypeReply.sameAs(message.contentType as ContentTypeId);

  return (
    <div className="flex mb-1">
      <span
        title={message.sentByMe ? "You" : message.senderAddress}
        className={message.sentByMe ? "text-zinc-500" : "text-green-500"}
      >
        {shortAddress(message.senderAddress)}:
      </span>
      <div className="ml-2">
        {isReply ? (
          <ReplyContent message={message} />
        ) : (
          <Content message={message} />
        )}
        {!isReply && !message.sentByMe && (
          <div>
            <Button
              type="button"
              color="secondary"
              size="sm"
              onClick={() => handleReply(message)}
            >
              Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
