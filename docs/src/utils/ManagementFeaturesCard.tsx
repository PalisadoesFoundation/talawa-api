import React from "react";

const ManagementFeaturesCard = () => {
  return (
    <div className="card__container card__wide">
      <h2 className="Heading">
      More Effective Management
      </h2>
      <div className="management__cards">
        <div className="management__card card__general">
            <div className="management__image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="my-svg-icon" aria-label="Calendar icon">         
  <path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L64 64C28.7 64 0 92.7 0 128l0 16 0 48L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256 0-48 0-16c0-35.3-28.7-64-64-64l-40 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L152 64l0-40zM48 192l352 0 0 256c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256z"/>
</svg>
            </div>
            <div>
            <h3 className="management__header">Easily schedule events</h3>
            <p className="card__description">
              Easily schedule events and track attendance. Reports show who’s coming, and how often
            </p>
          </div>
        </div>
        <div className="management__card card__general">
            <div className="management__image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="my-svg-icon" aria-label="Calendar icon">          
            <path d="M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z"/></svg>
            </div>
            <div>
            <h3 className="management__header">Stay in contact</h3>
            <p className="card__description">
            Stay in contact with your membership with individual or group emails, now and in the future
            </p>
          </div>
        </div>
        <div className="management__card card__general">
            <div className="management__image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="my-svg-icon" aria-label="Calendar icon">
            <path d="M448 160l-128 0 0-32 128 0 0 32zM48 64C21.5 64 0 85.5 0 112l0 64c0 26.5 21.5 48 48 48l416 0c26.5 0 48-21.5 48-48l0-64c0-26.5-21.5-48-48-48L48 64zM448 352l0 32-256 0 0-32 256 0zM48 288c-26.5 0-48 21.5-48 48l0 64c0 26.5 21.5 48 48 48l416 0c26.5 0 48-21.5 48-48l0-64c0-26.5-21.5-48-48-48L48 288z"/></svg>
            </div>
            <div>
            <h3 className="management__header">Track tasks</h3>
            <p className="card__description">
            Track your volunteer time and their activity tasks. Make your planning a success
            </p>
          </div>
        </div>
        <div className="management__card card__general">
            <div className="management__image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="my-svg-icon"  aria-label="Calendar icon">
            <path d="M128 32C92.7 32 64 60.7 64 96l0 256 64 0 0-256 384 0 0 256 64 0 0-256c0-35.3-28.7-64-64-64L128 32zM19.2 384C8.6 384 0 392.6 0 403.2C0 445.6 34.4 480 76.8 480l486.4 0c42.4 0 76.8-34.4 76.8-76.8c0-10.6-8.6-19.2-19.2-19.2L19.2 384z"/></svg>
            </div>
            <div>
            <h3 className="management__header">Intuitive design</h3>
            <p className="card__description">
            Our intuitive design helps streamline work processes and increases adoption so everyone can benefit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementFeaturesCard;
