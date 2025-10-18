import React from "react";
import ActionButton from "./ActionButton";

function HomeCallToAction(): JSX.Element {
	return (
		<>
			<ActionButton type="primary" href="/docs" buttonClassName="custom-button">
				Learn More
			</ActionButton>
			<ActionButton
				type="secondary"
				href="https://github.com/PalisadoesFoundation/talawa-api"
				buttonClassName="custom-button"
				target="_blank"
			>
				GitHub
			</ActionButton>
		</>
	);
}

export default HomeCallToAction;
