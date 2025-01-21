import React from "react";
import  Section  from "../../utils/Section";
import  TwoColumns  from "../../utils/TwoColumns";
import  TextColumn  from "../../utils/TextColumn";
import  textcontent  from "../../utils/textcontent";
import AppFeaturesCard from "../../utils/AppFeaturesCard";

 function FifthPanel() {
  return (
    <Section className="fifth-panel">
      <AppFeaturesCard/>
      {/* <div className="custom-panel">
        <div className="wrapper">
          <TwoColumns
            columnOne={
              <div className="text-column-offset">
                <TextColumn
                  title="Powerful, Fun Mobile Application"
                  text={textcontent.crossPlatform}
                />
              </div>
            }
            columnTwo={
              <div className="dissection">
                <img
                  alt="talawa"
                  src="img/panel-5-img.png"
                  className="fifth-panel-image"
                />
              </div>
            }
          />
        </div>
      </div> */}
    </Section>
  );
}

export default FifthPanel