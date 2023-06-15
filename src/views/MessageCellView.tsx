import { ReactElement } from "react";
import { Message } from "../db/db";
import { shortAddress } from "../util/shortAddress";

export default function MessageCellView({
  message,
}: {
  message: Message;
}): ReactElement {
  return (
    <div>
      <span className="text-zinc-500">
        {shortAddress(message.senderAddress)}:
      </span>{" "}
      {message.text}
    </div>
  );
}
