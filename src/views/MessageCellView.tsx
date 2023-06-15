import { ReactElement } from "react";
import { Message } from "../model/db";
import { shortAddress } from "../util/shortAddress";

export default function MessageCellView({
  message,
}: {
  message: Message;
}): ReactElement {
  return (
    <div>
      <span className={message.sentByMe ? "text-zinc-500" : "text-green-500"}>
        {shortAddress(message.senderAddress)}
      </span>{" "}
      {message.text}
    </div>
  );
}
