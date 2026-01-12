import crypto from "node:crypto";

/**
 * Generates a cryptographically secure JWT secret.
 * @returns A 128-character hexadecimal string.
 * @throws Error if crypto operations fail.
 */
export function generateJwtSecret(): string {
	try {
		return crypto.randomBytes(64).toString("hex");
	} catch (err) {
		console.error(
			"⚠️ Warning: Failed to generate random bytes for JWT secret. This may indicate a system entropy issue.",
			err,
		);
		throw new Error("Failed to generate JWT secret");
	}
}

/**
 * Validates that the input is a valid URL with http or https protocol.
 * @param input - The URL string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validateURL(input: string): true | string {
	try {
		const url = new URL(input);
		const protocol = url.protocol.toLowerCase();
		if (protocol !== "http:" && protocol !== "https:") {
			return "Please enter a valid URL with http:// or https:// protocol.";
		}
		return true;
	} catch {
		return "Please enter a valid URL.";
	}
}

/**
 * Validates that the input is a valid port number (1-65535).
 * Rejects non-integer inputs including decimals and leading zeros (e.g., "08080").
 * @param input - The port string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validatePort(input: string): true | string {
	const portNumber = Number.parseInt(input, 10);
	if (
		Number.isNaN(portNumber) ||
		portNumber < 1 ||
		portNumber > 65535 ||
		portNumber.toString() !== input.trim()
	) {
		return "Please enter a valid port number (1-65535).";
	}
	return true;
}

/**
 * Validates that the input is a valid email address.
 * Uses basic regex validation suitable for setup scripts.
 * Note: This is not RFC 5322 compliant and may accept some edge-case invalid formats.
 * @param input - The email string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validateEmail(input: string): true | string {
	if (!input.trim()) {
		return "Email cannot be empty.";
	}
	if (input.length > 254) {
		return "Email is too long.";
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(input)) {
		return "Invalid email format. Please enter a valid email address.";
	}
	return true;
}

/**
 * Validates CloudBeaver admin username.
 * @param input - The admin name string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validateCloudBeaverAdmin(input: string): true | string {
	if (!input.trim()) return "Admin name is required";
	if (input.length < 3) return "Admin name must be at least 3 characters long";
	if (!/^[a-zA-Z0-9_]+$/.test(input))
		return "Admin name can only contain letters, numbers, and underscores";
	return true;
}

/**
 * Validates CloudBeaver password strength.
 * @param input - The password string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validateCloudBeaverPassword(input: string): true | string {
	if (!input.trim()) return "Password is required";
	if (input.length < 8) return "Password must be at least 8 characters long";
	if (!/[A-Za-z]/.test(input) || !/[0-9]/.test(input)) {
		return "Password must contain both letters and numbers";
	}
	return true;
}

/**
 * Validates CloudBeaver server URL format.
 * Checks for HTTP/HTTPS protocol and valid port range (1-65535).
 * @param input - The URL string to validate.
 * @returns `true` if valid, or an error message string if invalid.
 */
export function validateCloudBeaverURL(input: string): true | string {
	if (!input.trim()) return "Server URL is required";

	// Pre-extract port from URL string before parsing
	// This handles cases where new URL() throws for invalid ports (>65535)
	const portMatch = input.match(/:(\d+)(\/|$)/);
	if (portMatch) {
		const portNum = Number.parseInt(portMatch[1], 10);
		if (portNum < 1 || portNum > 65535) {
			return "Invalid port in URL";
		}
	}

	try {
		const url = new URL(input);
		if (!["http:", "https:"].includes(url.protocol)) {
			return "URL must use HTTP or HTTPS protocol";
		}
		const port = url.port || (url.protocol === "https:" ? "443" : "80");
		const portNum = Number.parseInt(port, 10);
		if (!/^\d+$/.test(port) || portNum < 1 || portNum > 65535) {
			return "Invalid port in URL";
		}
		return true;
	} catch {
		return "Invalid URL format";
	}
}
