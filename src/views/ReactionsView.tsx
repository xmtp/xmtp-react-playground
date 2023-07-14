import { ReactElement, useState } from "react";
import { Message, MessageReaction } from "../model/db";
import { useReactions } from "../hooks/useReactions";
import { addReaction, removeReaction } from "../model/reactions";
import { useClient } from "../hooks/useClient";
import classNames from "classnames";

const defaultReactions = {
  thumbsup: "👍",
  thumbsdown: "👎",
  tada: "🎉",
} as const;

type ReactionString = keyof typeof defaultReactions;
type ReactionEmoji = (typeof defaultReactions)[ReactionString];
type ReactionEntries = [ReactionString, ReactionEmoji][];

function nameToEmoji(name: ReactionString): string {
  return defaultReactions[name];
}

function ReactionView({
  clientAddress,
  name,
  reactions,
  onAdd,
  onRemove,
}: {
  clientAddress: string;
  name: ReactionString;
  reactions: MessageReaction[];
  onAdd: () => void;
  onRemove: () => void;
}): ReactElement {
  const currentUserReacted = reactions
    .map((reaction) => reaction.reactor)
    .includes(clientAddress);

  function onClick() {
    if (currentUserReacted) {
      onRemove();
    } else {
      onAdd();
    }
  }

  return (
    <button
      onClick={onClick}
      className={classNames(
        "py-0.5 px-2 border rounded text-xs text-zinc-500",
        {
          "bg-yellow-200": currentUserReacted,
        }
      )}
    >
      {nameToEmoji(name)} {reactions.length}
    </button>
  );
}

export default function ReactionsView({
  message,
}: {
  message: Message;
}): ReactElement {
  const client = useClient();
  const reactions = useReactions(message) || [];
  const [isReacting, setIsReacting] = useState(false);

  const reactionsByName = reactions.reduce((acc, curr) => {
    const name = curr.name as ReactionString;
    if (acc[name]) {
      acc[name]?.push(curr);
    } else {
      acc[name] = [curr];
    }
    return acc;
  }, {} as { [key in ReactionString]?: MessageReaction[] });

  const isFullyReacted =
    reactions.length === Object.keys(defaultReactions).length;

  return (
    <div className="flex space-x-2">
      {(Object.keys(reactionsByName) as ReactionString[]).map<ReactElement>(
        (name) => {
          return (
            <ReactionView
              key={name}
              name={name}
              reactions={reactionsByName[name] ?? []}
              clientAddress={client?.address ?? ""}
              onAdd={() => {
                addReaction(name, message, client);
                setIsReacting(false);
              }}
              onRemove={() => {
                removeReaction(name, message, client);
                setIsReacting(false);
              }}
            />
          );
        }
      )}

      {!isFullyReacted ? (
        isReacting ? (
          <div className="space-x-2">
            {(Object.entries(defaultReactions) as ReactionEntries)
              .map(([name, emoji]) => {
                if (reactionsByName[name]) {
                  return null;
                }
                return (
                  <button
                    onClick={() => addReaction(name, message, client)}
                    key={name}
                    className="py-0.5 px-2 border rounded text-xs text-zinc-500"
                  >
                    {emoji}
                  </button>
                );
              })
              .filter(Boolean)}

            <button
              className="text-xs text-zinc-500"
              onClick={() => setIsReacting(false)}
            >
              cancel
            </button>
          </div>
        ) : (
          <button
            className="text-xs text-zinc-500"
            onClick={() => setIsReacting((prev) => !prev)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
              />
            </svg>
          </button>
        )
      ) : null}
    </div>
  );
}
