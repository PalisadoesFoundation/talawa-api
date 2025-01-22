import React from "react";
import Section from "../../utils/Section";
import ManagementFeaturesCard from "../../utils/ManagementFeaturesCard";

interface ThirdPanelProps {}

const ThirdPanel: React.FC<ThirdPanelProps> = () => {
  // const imgUrl = useBaseUrl("img/image-03.png");

  return (
    <Section className="third-panel" background="light">
      <ManagementFeaturesCard />


    </Section>
  );
};

export default ThirdPanel;
