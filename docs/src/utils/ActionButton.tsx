import type React from "react";

interface ActionButtonProps {
	href: string;
	type?: "primary" | "secondary";
	target?: string;
	children: React.ReactNode;
	buttonClassName?: string;
	ariaLabel?: string;
}

function ActionButton({
	href,
	type = "primary",
	target,
	children,
	buttonClassName,
}: ActionButtonProps) {
	return (
		<button
			type="button"
			className={`ActionButton ${type} ${buttonClassName}`}
			onClick={() => window.open(href, target)}
			aria-label={typeof children === "string" ? children : undefined}
		>
			{children}
		</button>
	);
}

export default ActionButton;
