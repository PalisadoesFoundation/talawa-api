import React, { FC } from "react";

interface Props {
    /** Content to be rendered in the first column */
    columnOne: React.ReactNode;
    /** Content to be rendered in the second column */
     columnTwo: React.ReactNode | JSX.Element;
    /** When true, reverses the order of columns */
     reverse?: boolean;
  }
  
 const TwoColumns: FC<Props> = ({ columnOne, columnTwo, reverse = false }) => {
  const firstColumnClasses = `column first ${reverse? 'right' : 'left'}`;
  const lastColumnClasses = `column last ${reverse? 'left' : 'right'}`;
  const containerClasses = `TwoColumns ${reverse? 'reverse' : ''}`;

  return (
    <section className={containerClasses} role="region">
     <div className={firstColumnClasses} role="presentation">
        {columnOne}
      </div>
      <div className={lastColumnClasses} role="presentation">
        {columnTwo}
      </div>
    </section>
  );
};

export default TwoColumns