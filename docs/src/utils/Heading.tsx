import React from 'react';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  text: string;
}
const Heading: React.FC<HeadingProps> = ({ text, className, ...rest }) => (
  <h2 className={['Heading', className].filter(Boolean).join(' ')} {...rest}>
    {text}
  </h2>
);

export default Heading;
