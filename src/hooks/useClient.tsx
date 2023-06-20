import { useContext } from "react";
import { ClientContext } from "../contexts/ClientContext";
import { Client } from "@xmtp/xmtp-js";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "xmtp-content-type-remote-attachment";

export function useClient() {
  return useContext(ClientContext).client;
}

export function useSetClient() {
  const setClient = useContext(ClientContext).setClient;

  return (client: Client) => {
    client.registerCodec(new AttachmentCodec());
    client.registerCodec(new RemoteAttachmentCodec());
    client.enableGroupChat();

    setClient(client);
  };
}
