import React from "react";

interface ActionButtonProps {
  href: string;
  type?: "primary" | "secondary";
  target?: string;
  children: React.ReactNode;
  buttonClassName?: string;
}

 function ActionButton({
  href,
  type = "primary",
  target,
  children,
  buttonClassName,
}: ActionButtonProps) {
  return (
    <a
      className={`ActionButton ${type} ${buttonClassName}`}
      rel="noopener"
      href={href}
      target={target}
    >
      {children}
    </a>
  );
}

export default ActionButton