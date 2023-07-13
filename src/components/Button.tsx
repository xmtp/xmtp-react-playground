import { ReactElement, ReactEventHandler } from "react";

export default function Button({
  children,
  onClick,
  type,
  color,
  className,
  disabled,
  size = "md",
}: {
  children: ReactElement | string;
  onClick?: ReactEventHandler | undefined;
  type: "submit" | "button";
  color?: "primary" | "secondary";
  className?: string | undefined;
  disabled?: boolean;
  size?: "sm" | "md";
}): ReactElement {
  const buttonColor =
    color == "secondary" || disabled ? "bg-gray-500" : "bg-blue-600";

  const buttonSize = size === "sm" ? "text-xs px-2 py-1" : "text-sm px-3 py-2";

  return (
    <button
      disabled={disabled}
      type={type}
      className={`${buttonColor} ${buttonSize} rounded-md inline-flex items-center font-semibold text-white shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
