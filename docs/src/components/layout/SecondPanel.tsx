import React from "react";
import  Section  from "../../utils/Section";
import OrganizationFeatureCard from "../../utils/OrganizationFeatureCard";

interface SecondPanelProps {}

 const SecondPanel: React.FC<SecondPanelProps> = () => {
  return (
    <Section className="SecondPanel">
     
      <OrganizationFeatureCard/>
    
    </Section>
  );
};

export default SecondPanel