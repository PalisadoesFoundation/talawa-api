import React from "react";

const AppFeaturesCard = () => {
	return (
		<div className="card__container card__wide">
			<div className="app-feature-card">
				<div className="app-feature-card__body card__general">
					<h2 className="Heading">
						Powerful, Fun <br /> Mobile Application
					</h2>
					<p className="card__description">
						Easily stay connected with your community! View social media feeds,
						share posts, create group events, chat with members, and receive
						important updates. Strengthen your community with reminders and
						notifications—all in one app.
					</p>
				</div>
				<div className="app-feature-card__image">
					<img alt="talawa" src="img/panel-5-img.png" />
				</div>
			</div>
		</div>
	);
};

export default AppFeaturesCard;
