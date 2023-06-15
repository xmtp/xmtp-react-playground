import { ReactElement, useState } from "react";
import ConversationListView from "./ConversationListView";
import { useClient } from "../hooks/useClient";
import { shortAddress } from "../util/shortAddress";

export default function HomeView(): ReactElement {
  const client = useClient()!;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(client.address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="p-4">
      <small>
        Hi {shortAddress(client.address)}{" "}
        <button className="text-xs text-zinc-600" onClick={copy}>
          {copied ? "Copied!" : "Copy"}
        </button>
        <br />
        Here are your conversations:
      </small>
      <ConversationListView />
    </div>
  );
}
