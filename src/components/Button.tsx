import { ReactElement, ReactEventHandler } from "react";

export default function Button({
  children,
  onClick,
  type,
  color,
}: {
  children: ReactElement | string;
  onClick?: ReactEventHandler | undefined;
  type: "submit" | "button";
  color?: "primary" | "secondary";
}): ReactElement {
  const buttonColor = color == "secondary" ? "bg-gray-500" : "bg-blue-600";

  return (
    <button
      type={type}
      className={`${buttonColor} inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
