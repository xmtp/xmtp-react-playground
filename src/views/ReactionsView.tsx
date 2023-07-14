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
            className="text-xs text-blue-600"
            onClick={() => setIsReacting((prev) => !prev)}
          >
            React
          </button>
        )
      ) : null}
    </div>
  );
}
