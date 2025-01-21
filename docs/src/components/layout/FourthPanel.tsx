import React from "react";
import Section from "../../utils/Section";
import TwoColumns from "../../utils/TwoColumns";
import TextColumn from "../../utils/TextColumn";
import textcontent from "../../utils/textcontent";

interface FourthPanelProps {
	className?: string;
}

const FourthPanel: React.FC<FourthPanelProps> = ({ className }) => {
	return (
		<Section className={`NativeDevelopment ${className} fourth-panel`}>
			<div className="card__general card__wide">
				<TwoColumns
					reverse
					columnOne={
						<TextColumn
							title="Great Admin Features"
							text={textcontent.forEveryone}
							aria-label="Admin features overview"
						/>
					}
					columnTwo={
						<div className="dissection">
							<img
								alt="talawa"
								src="img/image-04.png"
								className="fourth-panel-image"
								aria-label="Administrative interface demonstration"
							/>
						</div>
					}
				/>
			</div>
		</Section>
	);
}

export default FourthPanel;
