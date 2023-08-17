import { useContext } from "react";
import { ClientContext } from "../contexts/ClientContext";
import { Client } from "@xmtp/xmtp-js";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";

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
      client.registerCodec(new ReactionCodec());
      client.registerCodec(new ReadReceiptCodec());
    }

    setClient(client);
  };
}
