import { useContext } from "react";
import { ClientContext } from "../contexts/ClientContext";
import { Client } from "@xmtp/xmtp-js";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";

export function useClient() {
  return useContext(ClientContext).client;
}

export function useSetClient() {
  const setClient = useContext(ClientContext).setClient;

  return (client: Client | null) => {
    if (client) {
      client.registerCodec(new AttachmentCodec());
      client.registerCodec(new RemoteAttachmentCodec());
      client.registerCodec(new ReplyCodec());
      client.enableGroupChat();
    }

    setClient(client);
  };
}
