import React from "react";
import  Section  from "../../utils/Section";
import  TwoColumns  from "../../utils/TwoColumns";
import  HomeCallToAction  from "../../utils/HomeCallToAction";
import useBaseUrl from "@docusaurus/useBaseUrl";


function HeaderHero() {
  return (
    <Section background="light" className="HeaderHero">
      <div className="socialLinks"></div>
      <TwoColumns
        reverse
        columnOne={
          <div className="image-container">
            <img
              className="custom-image bounce-animation"
              src={useBaseUrl("img/image-01.png")}
              alt="Talawa member management software interface showcase"
              loading="lazy"
              // srcSet={`${useBaseUrl("img/image-01.png")} 1x, ${useBaseUrl("img/image-01@2x.png")} 2x`}
            />
          </div>
        }
        columnTwo={
          <>
           <h1 className="title" aria-label="Talawa - Member Management Software">
            <span>Talawa</span>
            <span className="tagline">Member Management Software</span>
          </h1>
          <p className="description" aria-label="Target audience description">
            For open source projects, charities and other non-profits
          </p>
            <div className="buttons">
              <HomeCallToAction />
            </div>
          </>
        }
      />
    </Section>
  );
}

export default HeaderHero
