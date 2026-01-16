/**
 * Masks an email address for logging purposes to protect privacy.
 * Shows first character of local part and full domain.
 *
 * @param email - The email address to mask
 * @returns Masked email (e.g., "j***@example.com")
 *
 * @example
 * ```typescript
 * maskEmail("john.doe@example.com") // Returns "j***@example.com"
 * maskEmail("a@test.org") // Returns "a***@test.org"
 * ```
 */
export function maskEmail(email: string): string {
	const atIndex = email.indexOf("@");

	if (atIndex === -1 || atIndex === 0) {
		// Invalid email format or empty local part - mask entire string
		return "***";
	}

	const localPart = email.substring(0, atIndex);
	const domain = email.substring(atIndex);

	// Show first character + *** + domain
	const firstChar = localPart.charAt(0);
	return `${firstChar}***${domain}`;
}
