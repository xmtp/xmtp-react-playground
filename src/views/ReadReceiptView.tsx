import { ReactElement } from "react";

export default function ReadReceiptView({
  readReceiptText,
}: {
  readReceiptText: string | undefined;
}): ReactElement {
  return readReceiptText ? (
    <span
      className={`text-xs ${
        readReceiptText === "Read" ? "text-gray-400" : "text-red-400"
      }`}
    >
      {readReceiptText}
    </span>
  ) : (
    <></>
  );
}
