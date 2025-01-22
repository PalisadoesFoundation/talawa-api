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
      <ActionButton
        type="secondary"
        href="https://github.com/PalisadoesFoundation"
        buttonClassName="custom-button"
         target="_blank"
      
      >
        GitHub
      </ActionButton>
    </>
  );
};


export default HomeCallToAction