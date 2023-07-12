import { ReactElement, useEffect } from "react";
import Button from "../components/Button";
import { useClient, useSetClient } from "../hooks/useClient";
import { Wallet } from "ethers";
import { Client } from "@xmtp/xmtp-js";
import "@rainbow-me/rainbowkit/styles.css";
import {
  AttachmentCodec,
  RemoteAttachmentCodec,
} from "@xmtp/content-type-remote-attachment";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function LoginView(): ReactElement {
  const setClient = useSetClient();

  async function generateWallet() {
    const wallet = Wallet.createRandom();
    const client = await Client.create(wallet, {
      env: "dev",
    });

    // Don't do this in real life.
    localStorage.setItem("_insecurePrivateKey", wallet.privateKey);

    setClient(client);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
      <div className="mx-auto max-w-3xl"></div>
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Login
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>You can generate a wallet or connect your own.</p>
          </div>
          <div className="mt-5 flex space-x-4">
            <Button
              type="button"
              onClick={generateWallet}
              className="rounded-lg"
            >
              Generate Wallet
            </Button>
            <div className="connect-button">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
