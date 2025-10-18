import React, { type HTMLAttributes } from 'react';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  text: string;
}

function Heading({ text, className, ...rest }: HeadingProps): JSX.Element {
  return (
    <h2 className={['Heading', className].filter(Boolean).join(' ')} {...rest}>
      {text}
    </h2>
  );
}

export default Heading;
