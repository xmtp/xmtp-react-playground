import { ReactElement } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function LoginView(): ReactElement {

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
      <div className="mx-auto max-w-3xl"></div>
      <div className="bg-white shadow sm:rounded-lg flex items-center justify-center">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900 text-center">
            Scrib
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Decentralised communicaiton. Start by connecting your wallet.</p>
          </div>
          <div className="mt-5 flex space-x-4 flex items-center justify-center">
            <div className="connect-button">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
