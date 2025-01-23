import React from "react";

interface ActionButtonProps {
  href: string;
  type?: "primary" | "secondary";
  target?: string;
  children: React.ReactNode;
  buttonClassName?: string;
  ariaLabel?: string;
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
      rel={target === '_blank' ? "noopener noreferrer" : undefined}
      href={href}
      target={target}
      role="button"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </a>
  );
}

export default ActionButton