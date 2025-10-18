import clsx from 'clsx';
import React, { type ElementType, type ReactNode } from 'react';
interface SectionProps {
  element?: ElementType;
  children: ReactNode;
  className?: string;
  background?: 'light' | 'dark' | 'tint';
  role?: string;
}

function Section({
  element = 'section',
  children,
  className,
  background = 'light',
  role,
}: SectionProps) {
  const El: ElementType = element;
  return (
    <El className={clsx('Section', className, background)} role={role}>
      {children}
    </El>
  );
}

export default Section;
