import { ReactElement, ReactEventHandler } from "react";

export default function Button({
  children,
  onClick,
  type,
}: {
  children: ReactElement | string;
  onClick?: ReactEventHandler | undefined;
  type: "submit" | "button";
}): ReactElement {
  return (
    <button
      type={type}
      className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
