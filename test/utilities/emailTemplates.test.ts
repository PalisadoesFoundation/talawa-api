import { expect, suite, test } from "vitest";
import {
	formatExpiryTime,
	getEmailVerificationEmailHtml,
	getEmailVerificationEmailText,
	getOnSpotAttendeeWelcomeEmailHtml,
	getOnSpotAttendeeWelcomeEmailText,
	getPasswordResetEmailHtml,
	getPasswordResetEmailText,
} from "~/src/utilities/emailTemplates";

suite("emailTemplates", () => {
	suite("getPasswordResetEmailText", () => {
		test("should generate text email with expiry time", () => {
			const ctx = {
				userName: "John Doe",
				communityName: "Test Community",
				resetLink: "https://example.com/reset?token=abc123",
				expiryText: "1 hour",
			};

			const result = getPasswordResetEmailText(ctx);

			expect(result).toContain("Hello John Doe");
			expect(result).toContain("Test Community");
			expect(result).toContain("https://example.com/reset?token=abc123");
			expect(result).toContain("This link will expire in 1 hour.");
			expect(result).toContain("The Test Community Team");
		});

		test("should generate text email without expiry (no timeout)", () => {
			const ctx = {
				userName: "Jane Doe",
				communityName: "My Org",
				resetLink: "https://example.com/reset?token=xyz",
				expiryText: "",
			};

			const result = getPasswordResetEmailText(ctx);

			expect(result).toContain("Hello Jane Doe");
			expect(result).toContain("This link does not expire.");
			expect(result).not.toContain("will expire in");
		});
	});

	suite("getPasswordResetEmailHtml", () => {
		test("should generate HTML email with expiry time", () => {
			const ctx = {
				userName: "Alice",
				communityName: "Community X",
				resetLink: "https://example.com/reset?token=def",
				expiryText: "14 days",
			};

			const result = getPasswordResetEmailHtml(ctx);

			expect(result).toContain("<!DOCTYPE html>");
			expect(result).toContain("Hello Alice");
			expect(result).toContain("Community X");
			expect(result).toContain('href="https://example.com/reset?token=def"');
			expect(result).toContain("This link will expire in 14 days.");
		});

		test("should generate HTML email without expiry (no timeout)", () => {
			const ctx = {
				userName: "Bob",
				communityName: "My Platform",
				resetLink: "https://example.com/reset",
				expiryText: "",
			};

			const result = getPasswordResetEmailHtml(ctx);

			expect(result).toContain("This link does not expire.");
			expect(result).not.toContain("will expire in");
		});
	});

	suite("formatExpiryTime", () => {
		test("should return empty string for 0 seconds (no timeout)", () => {
			expect(formatExpiryTime(0)).toBe("");
		});

		test("should return '1 day' for exactly 1 day in seconds", () => {
			const oneDay = 24 * 60 * 60; // 86400 seconds
			expect(formatExpiryTime(oneDay)).toBe("1 day");
		});

		test("should return 'N days' for multiple days", () => {
			const twoDays = 2 * 24 * 60 * 60;
			const fourteenDays = 14 * 24 * 60 * 60;
			expect(formatExpiryTime(twoDays)).toBe("2 days");
			expect(formatExpiryTime(fourteenDays)).toBe("14 days");
		});

		test("should return '1 hour' for exactly 1 hour in seconds", () => {
			const oneHour = 60 * 60; // 3600 seconds
			expect(formatExpiryTime(oneHour)).toBe("1 hour");
		});

		test("should return 'N hours' for multiple hours (less than 1 day)", () => {
			const twoHours = 2 * 60 * 60;
			const twentyThreeHours = 23 * 60 * 60;
			expect(formatExpiryTime(twoHours)).toBe("2 hours");
			expect(formatExpiryTime(twentyThreeHours)).toBe("23 hours");
		});

		test("should return '1 minute' for exactly 1 minute", () => {
			const oneMinute = 60;
			expect(formatExpiryTime(oneMinute)).toBe("1 minute");
		});

		test("should return 'N minutes' for multiple minutes (less than 1 hour)", () => {
			const fiveMinutes = 5 * 60;
			const fiftyNineMinutes = 59 * 60;
			expect(formatExpiryTime(fiveMinutes)).toBe("5 minutes");
			expect(formatExpiryTime(fiftyNineMinutes)).toBe("59 minutes");
		});

		test("should clamp sub-minute values to 1 minute", () => {
			// 30 seconds should be clamped to 1 minute
			expect(formatExpiryTime(30)).toBe("1 minute");
			// 1 second should be clamped to 1 minute
			expect(formatExpiryTime(1)).toBe("1 minute");
		});

		test("should handle edge cases at boundaries", () => {
			// 59 seconds -> 0 minutes -> clamped to 1 minute
			expect(formatExpiryTime(59)).toBe("1 minute");
			// 60 seconds -> exactly 1 minute
			expect(formatExpiryTime(60)).toBe("1 minute");
			// 119 seconds -> 1 minute
			expect(formatExpiryTime(119)).toBe("1 minute");
			// 120 seconds -> 2 minutes
			expect(formatExpiryTime(120)).toBe("2 minutes");
		});
	});

	suite("getEmailVerificationEmailText", () => {
		test("should generate text email with expiry time", () => {
			const ctx = {
				userName: "John Doe",
				communityName: "Test Community",
				verificationLink: "https://example.com/verify?token=abc123",
				expiryText: "24 hours",
			};

			const result = getEmailVerificationEmailText(ctx);

			expect(result).toContain("Hello John Doe");
			expect(result).toContain("Welcome to Test Community!");
			expect(result).toContain("https://example.com/verify?token=abc123");
			expect(result).toContain("This link will expire in 24 hours.");
			expect(result).toContain("The Test Community Team");
		});

		test("should generate text email without expiry (no timeout)", () => {
			const ctx = {
				userName: "Jane Doe",
				communityName: "My Org",
				verificationLink: "https://example.com/verify?token=xyz",
				expiryText: "",
			};

			const result = getEmailVerificationEmailText(ctx);

			expect(result).toContain("Hello Jane Doe");
			expect(result).toContain("This link does not expire.");
			expect(result).not.toContain("will expire in");
		});
	});

	suite("getEmailVerificationEmailHtml", () => {
		test("should generate HTML email with expiry time", () => {
			const ctx = {
				userName: "Alice",
				communityName: "Community X",
				verificationLink: "https://example.com/verify?token=def",
				expiryText: "14 days",
			};

			const result = getEmailVerificationEmailHtml(ctx);

			expect(result).toContain("<!DOCTYPE html>");
			expect(result).toContain("Hello Alice");
			expect(result).toContain("Welcome to Community X!");
			expect(result).toContain('href="https://example.com/verify?token=def"');
			expect(result).toContain("This link will expire in 14 days.");
		});

		test("should generate HTML email without expiry (no timeout)", () => {
			const ctx = {
				userName: "Bob",
				communityName: "My Platform",
				verificationLink: "https://example.com/verify",
				expiryText: "",
			};

			const result = getEmailVerificationEmailHtml(ctx);

			expect(result).toContain("This link does not expire.");
			expect(result).not.toContain("will expire in");
		});
	});

	suite("getOnSpotAttendeeWelcomeEmailText", () => {
		test("should generate text email without event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
			};

			const result = getOnSpotAttendeeWelcomeEmailText(ctx);

			expect(result).toContain("Hello New Attendee");
			expect(result).toContain("Welcome to Event Community!");
			expect(result).toContain("attendee@example.com");
			expect(result).toContain("TempPass123!");
			expect(result).toContain("https://example.com/login");
			expect(result).not.toContain("Event:");
		});

		test("should generate text email with full event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
				eventName: "Annual Conference",
				eventDate: "2025-03-15",
				eventTime: "9:00 AM",
				eventLocation: "Convention Center",
			};

			const result = getOnSpotAttendeeWelcomeEmailText(ctx);

			expect(result).toContain("Event: Annual Conference");
			expect(result).toContain("Date: 2025-03-15");
			expect(result).toContain("Time: 9:00 AM");
			expect(result).toContain("Location: Convention Center");
		});

		test("should generate text email with partial event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
				eventName: "Workshop",
			};

			const result = getOnSpotAttendeeWelcomeEmailText(ctx);

			expect(result).toContain("Event: Workshop");
			expect(result).not.toContain("Date:");
			expect(result).not.toContain("Time:");
			expect(result).not.toContain("Location:");
		});
	});

	suite("getOnSpotAttendeeWelcomeEmailHtml", () => {
		test("should generate HTML email without event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
			};

			const result = getOnSpotAttendeeWelcomeEmailHtml(ctx);

			expect(result).toContain("<!DOCTYPE html>");
			expect(result).toContain("Welcome to Event Community!");
			expect(result).toContain("attendee@example.com");
			expect(result).toContain("TempPass123!");
			expect(result).toContain('href="https://example.com/login"');
			expect(result).not.toContain("Event Details:");
		});

		test("should generate HTML email with full event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
				eventName: "Annual Conference",
				eventDate: "2025-03-15",
				eventTime: "9:00 AM",
				eventLocation: "Convention Center",
			};

			const result = getOnSpotAttendeeWelcomeEmailHtml(ctx);

			expect(result).toContain("Event Details:");
			expect(result).toContain("Annual Conference");
			expect(result).toContain("2025-03-15");
			expect(result).toContain("9:00 AM");
			expect(result).toContain("Convention Center");
		});

		test("should generate HTML email with partial event details", () => {
			const ctx = {
				userName: "New Attendee",
				communityName: "Event Community",
				emailAddress: "attendee@example.com",
				temporaryPassword: "TempPass123!",
				loginLink: "https://example.com/login",
				eventName: "Workshop",
				eventDate: "2025-04-01",
			};

			const result = getOnSpotAttendeeWelcomeEmailHtml(ctx);

			expect(result).toContain("Event Details:");
			expect(result).toContain("Workshop");
			expect(result).toContain("2025-04-01");
			expect(result).not.toContain("Time:");
			expect(result).not.toContain("Location:");
		});
	});
});
