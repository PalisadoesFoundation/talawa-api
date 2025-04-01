import validator from "validator";

export function sanitizeEmail(email: string): string {
	const trimmedEmail = email.trim();

	if (!validator.isEmail(trimmedEmail)) {
		throw new Error("Invalid email");
	}

	const cleaned = validator.stripLow(trimmedEmail);
	const cleanedEmail = validator.escape(cleaned);

	const normalizedEmail = validator.normalizeEmail(cleanedEmail);
	if (!normalizedEmail) {
		throw new Error("Failed to normalize email");
	}

	return normalizedEmail;
}

export function sanitizeText(text: string): string {
	const trimmedText = text.trim();

	if (/\s/.test(trimmedText)) {
		throw new Error("Text must not contain spaces or whitespace characters");
	}
	const cleaned = validator.stripLow(trimmedText);
	const cleanedText = validator.escape(cleaned);

	const allowedPattern = /^[a-zA-Z0-9@#%^*]+$/;

	if (!allowedPattern.test(cleanedText)) {
		throw new Error(
			"Text contains invalid characters. Only a-z, A-Z, 0-9, and @#%^* are allowed.",
		);
	}

	return cleanedText;
}
