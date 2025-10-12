import type React from "react";
import ActionButton from "./ActionButton";

const HomeCallToAction: React.FC = () => {
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
};

export default HomeCallToAction;
