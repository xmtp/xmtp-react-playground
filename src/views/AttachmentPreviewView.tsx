import { ReactElement } from "react";
import { Attachment } from "@xmtp/content-type-remote-attachment";

export default function AttachmentPreviewView({
  attachment,
  onDismiss,
}: {
  attachment: Attachment;
  onDismiss: () => void;
}): ReactElement {
  if (attachment.mimeType.startsWith("image/")) {
    const objectURL = URL.createObjectURL(
      new Blob([Buffer.from(attachment.data)], {
        type: attachment.mimeType,
      })
    );

    return (
      <div className="mb-2 bg-slate-800 text-white inline-block w-56 rounded-lg shadow">
        <img src={objectURL} className="rounded-t-lg" />
        <div className="p-2 text-xs">
          <small>
            {attachment.filename}{" "}
            <button className="text-blue-500" type="button" onClick={onDismiss}>
              Remove
            </button>
          </small>
        </div>
      </div>
    );
  }

  return <div>{attachment.filename}</div>;
}
