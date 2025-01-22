import React from "react";
import Section from "../../utils/Section";
import TextColumn from "../../utils/TextColumn";
import TwoColumns from "../../utils/TwoColumns";
import textcontent from "../../utils/textcontent";

interface EightPanelProps {}

const EightPanel: React.FC<EightPanelProps> = () => {
  return (

    <Section className="EightPanel">
      <div className="card__general card__wide">
        <TwoColumns
          reverse
          columnOne={
            <TextColumn
              title="Join Our Developer Community"
              text={textcontent.eightPanel}
              aria-label="Developer community information"
            />
          }
          columnTwo={
            <div className="dissection">
              <img
                alt="Diverse group of developers collaborating using various devices"
                src="img/image-08.png"
                className="eight-panel-image"
              />
            </div>
          }
        />
      </div>
    </Section>
  );
}

export default EightPanel;
