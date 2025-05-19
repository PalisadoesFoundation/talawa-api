import React from "react";
import clsx from 'clsx';
interface SectionProps {
  element?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  background?: "light" | "dark" | "tint";
  role?: string;
}

 function Section({
  element = "section",
  children,
  className,
  background = "light",
}: SectionProps) {
  const El = element;
  return (
    <El
    className={clsx('Section', className, background)}
    >
      {children}
    </El>
  );
}

export default Section
