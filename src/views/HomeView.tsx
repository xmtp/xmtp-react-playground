import { ReactElement, useState } from "react";
import ConversationListView from "./ConversationListView";
import { useClient } from "../hooks/useClient";
import { shortAddress } from "../util/shortAddress";
import { Link } from "react-router-dom";
import Header from "../components/Header";

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
    <div className="p-4 pt-14">
      <Header>
        Hi {shortAddress(client.address)}{" "}
        <button className="text-xs text-zinc-600" onClick={copy}>
          {copied ? "Copied Address!" : "Copy Address"}
        </button>
        <br />
      </Header>
      <small className="flex justify-between">
        <span>Here are your conversations:</span>
        <Link to="new" className="text-blue-700">
          Make a new one
        </Link>
      </small>
      <ConversationListView />
    </div>
  );
}
