import { FormEvent, ReactElement, createRef, useRef } from "react";
import Button from "../components/Button";
import { useConversation } from "../hooks/useConversation";
import { useClient } from "../hooks/useClient";
import { Conversation, getXMTPConversation, sendMessage } from "../model/db";
import { ContentTypeText } from "@xmtp/xmtp-js";

export default function MessageComposerView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  const textField = createRef<HTMLInputElement>();
  const client = useClient()!;

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    (async () => {
      const text = textField.current?.value;
      if (text) {
        await sendMessage(client, conversation, text, ContentTypeText);
        textField.current.value = "";
      }
    })();
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 p-4">
      <form className="flex space-x-4" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Type a message"
          className="p-2 flex-grow border rounded dark:bg-black dark:border-zinc-700"
          name="text"
          ref={textField}
          autoComplete="off"
        />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}
