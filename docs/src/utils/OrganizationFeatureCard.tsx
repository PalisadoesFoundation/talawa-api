import React from "react";

const OrganizationFeatureCard = () => {
  return (
    <div className="card__container">
      <h2 className="Heading">Easy Community Organization Management</h2>
      <div className="organization-feature-cards">
        <div className="organization-feature-card card__general">
          <div className="organization-feature-card__header">
            <h3>Open-Source Software for Organizations</h3>
          </div>
          <div className="organization-feature-card__body">
            <p className="card__description">
              Talawa provides customizable, open-source tools to help manage
              your organization efficiently.
            </p>
          </div>
          <div className="organization-feature-card__footer">
            <a href="https://github.com/PalisadoesFoundation" target="_blank" rel="noopener noreferrer">
              <button className="organization-feature-card__button">
                Learn More
              </button>
            </a>
          </div>
        </div>

        <div className="organization-feature-card card__general">
          <div className="organization-feature-card__header">
            <h3>Connect Your Community with Our Mobile App</h3>
          </div>
          <div className="organization-feature-card__body">
            <p className="card__description">
              Facilitate community interaction with social media-like features
              available on our app.
            </p>
          </div>
          <div className="organization-feature-card__footer">
          <a href="https://docs-mobile.talawa.io/docs-talawa-apk/" rel="noopener noreferrer">
            <button className="organization-feature-card__button">
              Get the App
            </button>
            </a>
          </div>
        </div>

        <div className="organization-feature-card card__general">
          <div className="organization-feature-card__header">
            <h3>Simplify Management with Our Admin Portal</h3>
          </div>
          <div className="organization-feature-card__body">
            <p className="card__description">
              Effortlessly manage members, events, and volunteers with our
              intuitive web portal.
            </p>
          </div>
          <div className="organization-feature-card__footer">
            <a href="https://docs-admin.talawa.io/" rel="noopener noreferrer">
              <button className="organization-feature-card__button">
                Get Started
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationFeatureCard;
