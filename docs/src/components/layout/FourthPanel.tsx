import React from "react";
import Section from "../../utils/Section";
import TwoColumns from "../../utils/TwoColumns";
import TextColumn from "../../utils/TextColumn";
import textcontent from "../../utils/textcontent";

interface FourthPanelProps {
	className?: string;
}

function FourthPanelProps({ className }: FourthPanelProps) {
	return (
		// background="tint" removed

		<Section className={`NativeDevelopment ${className} fourth-panel`}>
			<div className="card__general card__wide">
				<TwoColumns
					reverse
					columnOne={
						<TextColumn
							title="Great Admin Features"
							text={textcontent.forEveryone}
						/>
					}
					columnTwo={
						<div className="dissection">
							<img
								alt="talawa"
								src="img/image-04.png"
								className="fourth-panel-image"
							/>
						</div>
					}
				/>
			</div>
		</Section>
	);
}

export default FourthPanelProps;
