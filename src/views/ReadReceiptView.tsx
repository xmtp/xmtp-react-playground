import { ReactElement } from "react";

export default function ReadReceiptView({
  readReceiptText,
}: {
  readReceiptText: string | undefined;
}): ReactElement {
  return readReceiptText ? (
    <span className="text-xs text-gray-400">{readReceiptText}</span>
  ) : (
    <></>
  );
}
