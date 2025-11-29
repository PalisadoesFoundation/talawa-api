import React from "react";
import  ActionButton  from "./ActionButton";

interface HomeCallToActionProps {}

 const HomeCallToAction: React.FC<HomeCallToActionProps> = () => {
  return (
    <>
      <ActionButton
        type="primary"
        href="/docs"
        buttonClassName="custom-button"
       
      >
        Learn More
      </ActionButton>
      <a
        href="https://github.com/PalisadoesFoundation/talawa-api"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ActionButton
          type="secondary"
          href="#"
          buttonClassName="custom-button"
        >
          GitHub
        </ActionButton>
      </a>
    </>
  );
};


export default HomeCallToAction