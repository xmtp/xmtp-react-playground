import { FormEvent, ReactElement, createRef, useState } from "react";
import { Link, redirect, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Button from "../components/Button";
import {
  startConversation,
  // startGroupConversation,
} from "../model/conversations";
import { useClient } from "../hooks/useClient";

export default function NewConversationView(): ReactElement {
  const client = useClient()!;

  // We're using an uncontrolled component here because we don't need to update
  // anything as the user is typing.
  //
  // See https://react.dev/learn/manipulating-the-dom-with-refs#best-practices-for-dom-manipulation-with-refs
  const addressInputRef = createRef<HTMLInputElement>();

  const [error, setError] = useState<string | undefined>();
  const [addresses, setAddresses] = useState<string[]>([]);

  const navigate = useNavigate();

  function validateAddress(): string | undefined {
    const address = addressInputRef.current?.value || "";

    if (address.trim().length == 0) {
      addressInputRef.current?.classList.add("horizontal-shake");
      setTimeout(() => {
        addressInputRef.current?.classList.remove("horizontal-shake");
      }, 1000);

      addressInputRef.current?.focus();

      return;
    }

    return address;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (addresses.length == 0) {
      const address = validateAddress();
      if (!address) return;

      try {
        const conversation = await startConversation(client, address);
        navigate(`/`);
      } catch (e) {
        setError(String(e));
      }
    } else {
      // try {
      //   const conversation = await startGroupConversation(client, addresses);
      //   navigate(`/c/${conversation.topic}`);
      // } catch (e) {
      //   setError(String(e));
      // }
    }
  }

  function onAdd() {
    const address = validateAddress();
    if (!address) {
      return;
    }

    setAddresses((addresses) => [address, ...addresses]);

    addressInputRef.current!.value = "";
    addressInputRef.current?.focus();
  }

  return (
    <div className="p-4 pt-14">
      <Header>
        <div className="flex justify-between">
          <h1>Make a new conversation</h1>
          <Link className="text-blue-600" to="/">
            Go Back
          </Link>
        </div>
      </Header>
      <div>
        <form onSubmit={onSubmit} className="space-y-4">
          {addresses.length > 0 && (
            <div className="p-4 border rounded w-full md:w-1/2 mt-2">
              <h2 className="text-sm text-zinc-500 mb-2">
                Starting a group chat with:
              </h2>
              <ul>
                {addresses.map((address) => {
                  return (
                    <li key={address} className="list-item">
                      {address}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <div className="p-4 border rounded w-full md:w-1/2 mt-2">
              {error}
            </div>
          )}

          <label className="block">
            <span className="block text-xs my-2">
              Who {addresses.length > 0 && "else "}do you want to message with?
              0x937C0d4a6294cdfa575de17382c7076b579DC176
            </span>

            <input
              autoFocus
              ref={addressInputRef}
              type="text"
              className="border p-2 w-full md:w-1/2 rounded shadow-sm dark:bg-black"
              placeholder="Enter an address"
            ></input>
          </label>
          <label className="block space-x-4">
            <Button type="submit">Start Conversation</Button>
            <Button type="button" color="secondary" onClick={onAdd}>
              Add Someone Else
            </Button>
          </label>
        </form>
      </div>
    </div>
  );
}
