import React from "react";
import  Heading  from "./Heading";

interface TextColumnProps {
  title: string;
  text: string;
  moreContent?: React.ReactNode;
}

 function TextColumn({ title, text, moreContent }: TextColumnProps) {
  return (

     <article role="article" className="text-column">
      <Heading text={title} />
      <div 
        role="contentinfo"
        dangerouslySetInnerHTML={{ __html: text }}
      />
        className="text-content"
      {moreContent}

    </article>

  );
}

export default TextColumn