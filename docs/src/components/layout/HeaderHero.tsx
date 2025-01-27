import React from "react";
import  Section  from "../../utils/Section";
import  HomeCallToAction  from "../../utils/HomeCallToAction";


function HeaderHero() {
  return (
    <Section background="light" className="HeaderHero">
      <h1 className="title">Talawa API Docs</h1>
      <p className="description">
      API Backend for Talawa Admin and Talawa Mobile App
      </p>
      <div className="buttons">
        <HomeCallToAction />
      </div>
    </Section>
  );
}

export default HeaderHero
