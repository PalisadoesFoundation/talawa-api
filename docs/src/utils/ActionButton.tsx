import React, { type HTMLAttributeAnchorTarget, type ReactNode } from "react";

interface ActionButtonProps {
	href: string;
	type?: "primary" | "secondary";
	target?: HTMLAttributeAnchorTarget;
	children: ReactNode;
	buttonClassName?: string;
	ariaLabel?: string;
}

function ActionButton({
	href,
	type = "primary",
	target,
	children,
	buttonClassName,
	ariaLabel: ariaLabelProp,
}: ActionButtonProps) {
	const className = ["ActionButton", type, buttonClassName]
		.filter(Boolean)
		.join(" ");
	const resolvedAriaLabel =
		ariaLabelProp ?? (typeof children === "string" ? children : undefined);
	return (
		<a
			className={className}
			rel={target === "_blank" ? "noopener noreferrer" : undefined}
			href={href}
			target={target}
			aria-label={resolvedAriaLabel}
		>
			{children}
		</a>
	);
}

export default ActionButton;
