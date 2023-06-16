import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  createRef,
  useState,
} from "react";
import Button from "../components/Button";
import { useClient } from "../hooks/useClient";
import { Conversation } from "../model/db";
import { sendMessage } from "../model/messages";
import { ContentTypeText } from "@xmtp/xmtp-js";
import {
  Attachment,
  ContentTypeAttachment,
} from "xmtp-content-type-remote-attachment";
import AttachmentPreviewView from "./AttachmentPreviewView";

export default function MessageComposerView({
  conversation,
}: {
  conversation: Conversation;
}): ReactElement {
  const [attachment, setAttachment] = useState<Attachment | undefined>();

  const textField = createRef<HTMLInputElement>();
  const fileField = createRef<HTMLInputElement>();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const client = useClient()!;

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    (async () => {
      const text = textField.current?.value;
      if (text) {
        await sendMessage(client, conversation, text, ContentTypeText);
        textField.current.value = "";
      }

      if (attachment) {
        await sendMessage(
          client,
          conversation,
          attachment,
          ContentTypeAttachment
        );

        setAttachment(undefined);
      }
    })();
  }

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];

    if (!file) {
      return;
    }

    const arrayBuffer = await file.arrayBuffer();

    setAttachment({
      filename: file.name,
      mimeType: file.type,
      data: new Uint8Array(arrayBuffer),
    });

    window.scroll({ top: 10000, behavior: "smooth" });
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 p-4 bg-white dark:bg-zinc-900">
      <input
        ref={fileField}
        type="file"
        onChange={onChange}
        style={{ position: "absolute", marginLeft: "-10000px" }}
      />
      <form className="flex space-x-2 items-end" onSubmit={onSubmit}>
        <div className=" flex-grow border rounded dark:bg-black dark:border-zinc-700 p-2">
          {attachment && (
            <AttachmentPreviewView
              attachment={attachment}
              onDismiss={() => {
                setAttachment(undefined);
              }}
            />
          )}
          <div className="flex space-x-2">
            <button
              type="button"
              className="bg-blue-500 w-8 h-8 text-white rounded-full"
              onClick={() => fileField.current?.click()}
            >
              +
            </button>
            <input
              type="text"
              placeholder={
                attachment ? "Press Send to send attachment" : "Type a message"
              }
              className="flex-grow outline-none dark:bg-black"
              name="text"
              ref={textField}
              autoComplete="off"
              disabled={!!attachment}
            />
          </div>
        </div>

        <Button type="submit" className="mb-2">
          Send
        </Button>
      </form>
    </div>
  );
}
