/**
 * Mailpit API Helper
 *
 * This module provides helper functions to interact with Mailpit's REST API
 * for testing email functionality in e2e/integration tests.
 *
 * @example
 * ```ts
 * import { getMailpitMessages, clearMailpitMessages } from "./mailpitHelpers";
 *
 * // After triggering an email
 * const messages = await getMailpitMessages();
 * const email = findMessageByRecipient(messages, "user@example.com");
 * expect(email.Subject).toContain("Welcome");
 *
 * // Cleanup
 * await clearMailpitMessages();
 * ```
 */

import { rootLogger } from "~/src/utilities/logging/logger";

const MAILPIT_BASE_URL = "http://localhost:8025/api/v1";

/**
 * Mailpit message summary structure (from /messages endpoint)
 */
export interface MailpitMessage {
	ID: string;
	MessageID: string;
	Read: boolean;
	From: {
		Name: string;
		Address: string;
	};
	To: Array<{
		Address: string;
		Name: string;
	}>;
	Cc: null | Array<{ Address: string; Name: string }>;
	Bcc: null | Array<{ Address: string; Name: string }>;
	ReplyTo: Array<{ Address: string; Name: string }>;
	Subject: string;
	Created: string;
	Username: string;
	Tags: string[];
	Size: number;
	Attachments: number;
	Snippet: string;
}

/**
 * Mailpit message details structure (from /message/{id} endpoint)
 * Note: This has different fields than the summary, so it doesn't extend MailpitMessage
 */
export interface MailpitMessageDetails {
	ID: string;
	MessageID: string;
	From: {
		Name: string;
		Address: string;
	};
	To: Array<{
		Address: string;
		Name: string;
	}>;
	Cc: Array<{ Address: string; Name: string }>;
	Bcc: Array<{ Address: string; Name: string }>;
	ReplyTo: Array<{ Address: string; Name: string }>;
	ReturnPath: string;
	Subject: string;
	ListUnsubscribe: {
		Header: string;
		Links: string[];
		Errors: string;
		HeaderPost: string;
	};
	Date: string;
	Tags: string[];
	Username: string;
	Text: string;
	HTML: string;
	Size: number;
	Inline: unknown[];
	Attachments: unknown[];
}

/**
 * Mailpit info response structure (from /info endpoint)
 */
export interface MailpitInfo {
	Version: string;
	LatestVersion: string;
	Database: string;
	DatabaseSize: number;
	Messages: number;
	Unread: number;
	Tags: Record<string, unknown>;
	RuntimeStats: {
		Uptime: number;
		Memory: number;
		MessagesDeleted: number;
		SMTPAccepted: number;
		SMTPAcceptedSize: number;
		SMTPRejected: number;
		SMTPIgnored: number;
	};
}

/**
 * Fetches all messages from mailpit
 * @returns Array of messages
 * @throws Error if mailpit API is not accessible
 */
export async function getMailpitMessages(): Promise<MailpitMessage[]> {
	const response = await fetch(`${MAILPIT_BASE_URL}/messages`);
	if (!response.ok) {
		throw new Error(`Mailpit API error: ${response.status}`);
	}
	const data = (await response.json()) as { messages?: MailpitMessage[] };
	return data.messages || [];
}

/**
 * Fetches detailed information about a specific message
 * @param messageId - The ID of the message to fetch
 * @returns Detailed message information including body content
 * @throws Error if message not found or API error
 */
export async function getMailpitMessageDetails(
	messageId: string,
): Promise<MailpitMessageDetails> {
	const response = await fetch(`${MAILPIT_BASE_URL}/message/${messageId}`);
	if (!response.ok) {
		throw new Error(`Mailpit API error: ${response.status}`);
	}
	return (await response.json()) as MailpitMessageDetails;
}

/**
 * Clears all messages from mailpit
 * Useful for test cleanup
 */
export async function clearMailpitMessages(): Promise<void> {
	try {
		await fetch(`${MAILPIT_BASE_URL}/messages`, {
			method: "DELETE",
		});
	} catch {
		console.error(
			"Failed to clear mailpit messages. Is the Mailpit API running?",
		);
	}
}

/**
 * Finds a message by recipient email address
 * @param messages - Array of messages to search
 * @param emailAddress - Email address to search for
 * @returns The first matching message or undefined
 */
export function findMessageByRecipient(
	messages: MailpitMessage[],
	emailAddress: string,
): MailpitMessage | undefined {
	return messages.find((msg) =>
		msg.To.some(
			(recipient) =>
				recipient.Address.toLowerCase() === emailAddress.toLowerCase(),
		),
	);
}

/**
 * Finds messages by subject content
 * @param messages - Array of messages to search
 * @param subjectContent - Text to search for in subject line
 * @returns Array of matching messages
 */
export function findMessagesBySubject(
	messages: MailpitMessage[],
	subjectContent: string,
): MailpitMessage[] {
	return messages.filter((msg) =>
		msg.Subject.toLowerCase().includes(subjectContent.toLowerCase()),
	);
}

/**
 * Waits for an email to arrive in mailpit
 * @param recipientEmail - Email address to wait for
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 15000 in CI, 5000 local)
 * @param intervalMs - Polling interval in milliseconds (default: 500)
 * @param subject - Optional subject text to filter by for more specificity
 * @returns The message when found
 * @throws Error if timeout exceeded
 */
export async function waitForEmail(
	recipientEmail: string,
	timeoutMs?: number,
	intervalMs = 500,
	subject?: string,
): Promise<MailpitMessage> {
	const defaultTimeout = process.env.CI === "true" ? 15000 : 5000;
	const actualTimeout = timeoutMs ?? defaultTimeout;
	const startTime = Date.now();

	while (Date.now() - startTime < actualTimeout) {
		const messages = await getMailpitMessages();

		// Filter by recipient
		let matchingMessages = messages.filter((msg) =>
			msg.To.some(
				(recipient) =>
					recipient.Address.toLowerCase() === recipientEmail.toLowerCase(),
			),
		);

		// Filter by subject if specified for more specificity
		if (subject) {
			matchingMessages = matchingMessages.filter((msg) =>
				msg.Subject.toLowerCase().includes(subject.toLowerCase()),
			);
		}

		if (matchingMessages?.[0]) {
			return matchingMessages[0];
		}

		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	const subjectHint = subject ? ` with subject "${subject}"` : "";
	throw new Error(
		`Timeout waiting for email to ${recipientEmail}${subjectHint} after ${actualTimeout}ms`,
	);
}

/**
 * Checks if mailpit is available/running
 * @returns true if mailpit API is accessible
 */
export async function isMailpitRunning(): Promise<boolean> {
	try {
		const response = await fetch(`${MAILPIT_BASE_URL}/info`, {
			method: "GET",
		});
		return response.ok;
	} catch (error) {
		rootLogger.debug({ error }, "JSON validation failed for env var");
		return false;
	}
}

/**
 * Gets Mailpit server information
 * @returns Mailpit info object
 * @throws Error if mailpit API is not accessible
 */
export async function getMailpitInfo(): Promise<MailpitInfo> {
	const response = await fetch(`${MAILPIT_BASE_URL}/info`);
	if (!response.ok) {
		throw new Error(`Mailpit API error: ${response.status}`);
	}
	return (await response.json()) as MailpitInfo;
}

/**
 * Marks a message as read
 * @param messageId - The ID of the message to mark as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
	const res = await fetch(`${MAILPIT_BASE_URL}/messages`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			IDs: [messageId],
			Read: true,
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(
			`markMessageAsRead failed: ${res.status} ${res.statusText} - ${body}`,
		);
	}
}

/**
 * Deletes a specific message by ID
 * @param messageId - The ID of the message to delete
 */
export async function deleteMessage(messageId: string): Promise<void> {
	const res = await fetch(`${MAILPIT_BASE_URL}/messages`, {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			IDs: [messageId],
		}),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(
			`deleteMessage failed: ${res.status} ${res.statusText} - ${body}`,
		);
	}
}
