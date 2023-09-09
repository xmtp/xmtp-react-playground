import { ReactElement, useContext, useState } from "react";
import ConversationListView from "./ConversationListView";
import { useClient, useSetClient } from "../hooks/useClient";
import { shortAddress } from "../util/shortAddress";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { useDisconnect } from "wagmi";
import NavigationView from "./NavigationView";
import SidebarView from "./SidebarView";
import ConversationView from "./ConversationView";
import { UIContext } from "../contexts/UIContext";

export default function HomeView(): ReactElement {
  // const client = useClient()!;
  // const [copied, setCopied] = useState(false);

  // function copy() {
  //   navigator.clipboard.writeText(client.address);
  //   setCopied(true);
  //   setTimeout(() => {
  //     setCopied(false);
  //   }, 2000);
  // }

  // const { disconnectAsync } = useDisconnect();
  // const setClient = useSetClient();
  // async function logout() {
  //   await disconnectAsync();
  //   indexedDB.deleteDatabase("DB");
  //   localStorage.removeItem("_insecurePrivateKey");
  //   setClient(null);
  // }

  const conversation = useContext(UIContext).activeChat;

  return (
    <div className="xs:relative md:static h-full flex xs:flex-col md:flex-row overflow-hidden">
      {/* <div className="xs:order-1 md:-order-none"> */}
      <NavigationView />
      <SidebarView />
      {/* </div> */}
      {/* <Header>
        <div className="flex justify-between">
          <div>
            Hi {shortAddress(client.address)}{" "}
            <button className="text-xs text-zinc-600" onClick={copy}>
              {copied ? "Copied Address!" : "Copy Address"}
            </button>
          </div>
        </div>
      </Header> */}

      <div
        id="mainContent"
        className="xs:absolute xs:z-10 md:static grow h-full xs:w-full md:w-fit scrollbar-hidden bg-white dark:bg-gray-800 transition-all duration-500"
      >
        {conversation ? <ConversationView conversation={conversation} /> : ""}
      </div>

      {/* <small className="flex justify-between"></small> */}
    </div>
  );
}
