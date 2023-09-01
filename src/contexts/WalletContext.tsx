import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { PropsWithChildren, ReactElement, useEffect, useState } from "react";
import {
  configureChains,
  createClient,
  WagmiConfig,
  useSigner,
  useAccount,
  useDisconnect,
} from "wagmi";
import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { useSetClient } from "../hooks/useClient";
import { Client } from "@xmtp/xmtp-js";

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, polygon, optimism, arbitrum],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "XMTP Inbox",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

function WalletSetter({
  setWaitingForSignatures,
  children,
}: PropsWithChildren<{
  setWaitingForSignatures: (state: boolean) => void;
}>): ReactElement {
  const { disconnect } = useDisconnect();
  const { data: signer } = useSigner({
    onError: () => {
      setWaitingForSignatures(false);
      disconnect();
    },
  });
  const setClient = useSetClient();

  useEffect(() => {
    if (signer) {
      setWaitingForSignatures(true);
      (async () => {
        try {
          const client = await Client.create(signer, {
            env: "dev",
          });

          setClient(client);
          setWaitingForSignatures(false);
        } catch {
          disconnect();
          setWaitingForSignatures(false);
        }
      })();
    }
  }, [!!signer]);

  return <>{children}</>;
}

export default function WalletContext({
  children,
}: PropsWithChildren<unknown>): ReactElement {
  const [waitingForSignatures, setWaitingForSignatures] = useState(false);

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <WalletSetter setWaitingForSignatures={setWaitingForSignatures}>
          {waitingForSignatures ? (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
              <div className="mx-auto max-w-3xl"></div>
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-base font-semibold leading-6 text-gray-900">
                    Waiting for signatures…
                  </h3>
                  <p>
                    Sign the messages you've been prompted with in your wallet
                    app to sign in to XMTP.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </WalletSetter>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
