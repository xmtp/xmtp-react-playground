import { PropsWithChildren, ReactElement } from "react";

export default function Header({
  children,
}: PropsWithChildren<unknown>): ReactElement {
  return (
    <div className="text-xs bold fixed top-0 left-0 right-0 bg-white dark:bg-zinc-900 p-4 shadow">
      {children}
    </div>
  );
}
