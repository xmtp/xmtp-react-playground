import { FormEvent, ReactElement, createRef, useRef } from "react";
import { Message } from "../model/db";
import { shortAddress } from "../util/shortAddress";
import Button from "../components/Button";
import { sendMessage } from "../model/messages";
import { ContentTypeReply, Reply } from "@xmtp/content-type-reply";
import { ContentTypeText } from "@xmtp/xmtp-js";
import { useClient } from "../hooks/useClient";
import { findConversation } from "../model/conversations";

export default function ReplyComposer({
  inReplyToMessage,
  dismiss,
}: {
  inReplyToMessage: Message;
  dismiss: () => void;
}): ReactElement {
  const client = useClient()!;

  // We're using an uncontrolled component here because we don't need to update
  // anything as the user is typing.
  //
  // See https://react.dev/learn/manipulating-the-dom-with-refs#best-practices-for-dom-manipulation-with-refs
  const textField = createRef<HTMLInputElement>();

  async function reply(e: FormEvent) {
    e.preventDefault();

    const replyText = textField.current?.value;

    if (!replyText) {
      return;
    }

    const reply: Reply = {
      reference: inReplyToMessage.xmtpID,
      content: textField.current.value,
      contentType: ContentTypeText,
    };

    textField.current.value = "";

    const conversation = await findConversation(
      inReplyToMessage.conversationTopic
    );

    if (!conversation) {
      return;
    }

    await sendMessage(client, conversation, reply, ContentTypeReply);
  }

  return (
    <div>
      <form className="d-block flex space-x-2" onSubmit={reply}>
        <input
          autoFocus
          className="p-2 border rounded flex-grow w-96 text-xs dark:text-black"
          ref={textField}
          type="text"
          placeholder={`Reply to ${shortAddress(
            inReplyToMessage.senderAddress
          )}`}
        />

        <Button type="submit" color="primary" size="sm">
          Reply
        </Button>
        <button onClick={() => dismiss()} className="text-xs text-gray-500">
          Cancel
        </button>
      </form>
    </div>
  );
}
