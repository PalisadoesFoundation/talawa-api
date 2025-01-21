import React from "react";
import Section from "../../utils/Section";
import TextColumn from "../../utils/TextColumn";
import TwoColumns from "../../utils/TwoColumns";
import textcontent from "../../utils/textcontent";

function EightPanel() {
  return (
    // background="tint" removed
    <Section className="EightPanel">
      <div className="card__general card__wide">
        <TwoColumns
          reverse
          columnOne={
            <TextColumn
              title="Join Our Developer Community"
              text={textcontent.eightPanel}
            />
          }
          columnTwo={
            <div className="dissection">
              <img
                alt="people using devices"
                src="img/image-08.png"
                className="eigth-panel-image"
              />
            </div>
          }
        />
      </div>
    </Section>
  );
}

export default EightPanel;
