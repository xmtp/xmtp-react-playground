import { Client } from "@xmtp/xmtp-js";
import { Wallet } from "ethers";
import { createContext, useState, ReactElement, useEffect } from "react";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ReplyCodec } from "@xmtp/content-type-reply";
import { ReactionCodec } from "@xmtp/content-type-reaction";
import { ReadReceiptCodec } from "@xmtp/content-type-read-receipt";

type ClientContextValue = {
  client: Client | null;
  setClient: (client: Client | null) => void;
};

export const ClientContext = createContext<ClientContextValue>({
  client: null,
  setClient: () => {
    return;
  },
});

export default function ClientProvider({
  children,
}: {
  children: ReactElement;
}): ReactElement {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const insecurePrivateKey = localStorage.getItem("_insecurePrivateKey");

      if (!insecurePrivateKey) {
        setIsLoading(false);
        return;
      }

      const wallet = new Wallet(insecurePrivateKey);
      const client = await Client.create(wallet, {
        env: "dev",
      });

      client.registerCodec(new AttachmentCodec());
      client.registerCodec(new RemoteAttachmentCodec());
      client.registerCodec(new ReplyCodec());
      client.registerCodec(new ReactionCodec());
      client.registerCodec(new ReadReceiptCodec());

      setClient(client);
      setIsLoading(false);
    })();
  }, []);

  const clientContextValue = {
    client,
    setClient,
  };

  return (
    <ClientContext.Provider value={clientContextValue}>
      {isLoading ? (
        <div className="w-full p-4 m-auto">Loading client....</div>
      ) : (
        children
      )}
    </ClientContext.Provider>
  );
}
