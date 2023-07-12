import {
  createContext,
  useState,
  ReactElement,
  useMemo,
  useCallback,
} from "react";
import { Message } from "../model/db";

export type ReplyContextValue = {
  isReplying: boolean;
  setIsReplying: (replying: boolean, message?: Message) => void;
  message: Message | null;
};

export const ReplyContext = createContext<ReplyContextValue>({
  isReplying: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsReplying: () => {},
  message: null,
});

export default function ReplyProvider({
  children,
}: {
  children: ReactElement;
}): ReactElement {
  const [isReplying, _setIsReplying] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const setIsReplying = useCallback((replying: boolean, message?: Message) => {
    _setIsReplying(replying);
    setMessage(message ?? null);
  }, []);

  const value = useMemo(
    () => ({
      isReplying,
      setIsReplying,
      message,
    }),
    [isReplying, message, setIsReplying]
  );

  return (
    <ReplyContext.Provider value={value}>{children}</ReplyContext.Provider>
  );
}
