import React from "react";
import Section from "../../utils/Section";
import HomeCallToAction from "../../utils/HomeCallToAction";

function HeaderHero() {
  return (
    <Section background="light" className="HeaderHero" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <h1 className="title" style={{ textAlign: 'center', width: '100%' }}>Talawa</h1>
      
      <h2 className="tagline" style={{ textAlign: 'center', width: '100%' }}>API Docs</h2>
      
      <p className="description" style={{ textAlign: 'center', width: '100%', margin: '0 auto' }}>
        API Backend for Talawa Admin and Talawa Mobile App
      </p>
      
      <div className="buttons" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '20px' }}>
        <HomeCallToAction />
      </div>

    </Section>
  );
}

export default HeaderHero;