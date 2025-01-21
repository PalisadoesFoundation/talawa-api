import React from "react";
import Section from "../../utils/Section";
// import TextColumn from "../../utils/TextColumn";
// import TwoColumns from "../../utils/TwoColumns";
// import textcontent from "../../utils/textcontent";
// import useBaseUrl from "@docusaurus/useBaseUrl";
import AboutCards from "../../utils/ManagementFeaturesCard";

interface ThirdPanelProps {}

const ThirdPanel: React.FC<ThirdPanelProps> = () => {
  // const imgUrl = useBaseUrl("img/image-03.png");

  return (
    <Section className="third-panel" background="light">
      <AboutCards />

      {/* <TwoColumns
        columnOne={
          <TextColumn
            title="More Effective Management"
            text={textcontent.nativeCode}
          />
        }
        columnTwo={<img alt="" src={imgUrl} className="third-panel-image" />}
      /> */}
    </Section>
  );
};

export default ThirdPanel;
