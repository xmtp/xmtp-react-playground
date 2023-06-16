import { ReactElement, ReactEventHandler } from "react";

export default function Button({
  children,
  onClick,
  type,
  color,
  className,
  disabled,
}: {
  children: ReactElement | string;
  onClick?: ReactEventHandler | undefined;
  type: "submit" | "button";
  color?: "primary" | "secondary";
  className?: string | undefined;
  disabled?: boolean;
}): ReactElement {
  const buttonColor =
    color == "secondary" || disabled ? "bg-gray-500" : "bg-blue-600";

  return (
    <button
      disabled={disabled}
      type={type}
      className={`${className} ${buttonColor} inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
