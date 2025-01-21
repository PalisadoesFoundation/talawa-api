import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";

const ParticipationFeaturesCard = () => {
	return (
		<div className="card__container card__wide">
			<div className="card__general participation-feature-card">
				<div className="participation-feature-card__body">
					<h2 className="Heading">
						Globally Recognized, International Participation
					</h2>
					<img src={useBaseUrl(`img/talawa-logo-svg.svg`)} alt="Talawa logo" />
					<p className="card__description">
						Palisadoes was also selected for GSoC in 2022 and 2023. In 2022 the
						Google Season of Docs (GsoD) selected Palisadoes as a participant.
						In 2023 our Talawa projects were included in the Outreachy
						open-source internship program.
					</p>
					<p className="card__description">
						<span className="card__description">
							Talawa was created by The Palisadoes Foundation in 2019 as part of
							its social outreach programs in Jamaica. Our work was sponsored by
							local companies wanting to create a globally competitive workforce
							on the island by sponsoring philanthropic software development
							internships for university students.
						</span>
					</p>
					<p className="card__description">
						In 2021, Palisadoes was accepted into the prestigious Google Summer
						of Code (GSoC) which expanded the development team to volunteers
						around the world. That same year we participated in the GitHub
						India, GitHub Externship program for both the winter and summer
						cohorts.
					</p>
				</div>
				<div className="participation-feature-card__image">
				<img alt="talawa" src={useBaseUrl("img/image-07.png")} />
				</div>
			</div>
		</div>
	);
};

export default ParticipationFeaturesCard;
