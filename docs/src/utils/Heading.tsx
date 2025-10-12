import type React from "react";

interface HeadingProps {
	text: string;
	[key: string]: unknown;
}

const Heading: React.FC<HeadingProps> = ({ text, ...props }) => {
	return (
		<h2 className="Heading" {...props}>
			{text}
		</h2>
	);
};
export default Heading;
