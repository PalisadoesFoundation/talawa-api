import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import { SESProvider } from "~/src/services/email/providers/SESProvider";
import type { EmailJob, NonEmptyString } from "~/src/services/email/types";

// Mock the AWS SDK
vi.mock("@aws-sdk/client-ses", () => {
	const SESClientMock = vi.fn();
	SESClientMock.prototype.send = vi.fn();
	return {
		SESClient: SESClientMock,
		SendEmailCommand: vi.fn(),
	};
});

describe("SESProvider", () => {
	const mockConfig = {
		region: "us-east-1" as NonEmptyString,
		accessKeyId: "test-key",
		secretAccessKey: "test-secret",
		fromEmail: "test@example.com",
		fromName: "Test Sender",
	};
	let sesProvider: SESProvider;

	beforeEach(() => {
		vi.clearAllMocks();
		sesProvider = new SESProvider(mockConfig);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should throw error if API_AWS_SES_REGION is empty string", async () => {
		const provider = new SESProvider({
			...mockConfig,
			region: "" as NonEmptyString,
		});

		await expect(
			provider.sendEmail({
				id: "1",
				email: "recipient@example.com",
				subject: "Subject",
				htmlBody: "Body",
				userId: "123",
			}),
		).resolves.toEqual(
			expect.objectContaining({
				success: false,
				error: "API_AWS_SES_REGION must be a non-empty string",
			}),
		);
	});

	it("should initialize SESClient with correct config", async () => {
		// Trigger initialization
		await sesProvider.sendEmail({
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		expect(SESClient).toHaveBeenCalledWith({
			region: "us-east-1",
			credentials: {
				accessKeyId: "test-key",
				secretAccessKey: "test-secret",
			},
		});
	});

	it("should send email successfully", async () => {
		const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-123" });
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "HTML Body",
			textBody: "Text Body",
			userId: "123",
		};

		const result = await sesProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: true,
			messageId: "msg-123",
		});

		expect(SendEmailCommand).toHaveBeenCalledWith({
			Source: "Test Sender <test@example.com>",
			Destination: { ToAddresses: ["recipient@example.com"] },
			Message: {
				Subject: { Data: "Subject", Charset: "UTF-8" },
				Body: {
					Html: { Data: "HTML Body", Charset: "UTF-8" },
					Text: { Data: "Text Body", Charset: "UTF-8" },
				},
			},
		});
	});

	it("should handle SES errors gracefully", async () => {
		const mockSend = vi.fn().mockRejectedValue(new Error("AWS Error"));
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		const result = await sesProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: false,
			error: "AWS Error",
		});
	});

	it("should handle non-Error thrown values gracefully", async () => {
		// Test that non-Error exceptions are converted to strings
		const mockSend = vi.fn().mockRejectedValue("Plain string error");
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		const result = await sesProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: false,
			error: "Plain string error",
		});
	});

	it("should send bulk emails", async () => {
		const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-id" });
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const jobs = [
			{
				id: "1",
				email: "r1@example.com",
				subject: "S1",
				htmlBody: "B1",
				userId: "u1",
			},
			{
				id: "2",
				email: "r2@example.com",
				subject: "S2",
				htmlBody: "B2",
				userId: "u2",
			},
		];

		const results = await sesProvider.sendBulkEmails(jobs);

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);
		expect(results[1]?.success).toBe(true);
		expect(mockSend).toHaveBeenCalledTimes(2);
	});

	it("should throw error if fromEmail is not configured", async () => {
		const provider = new SESProvider({
			region: "us-east-1" as NonEmptyString,
			accessKeyId: "key",
			secretAccessKey: "secret",
			// fromEmail missing
		});

		await expect(
			provider.sendEmail({
				id: "1",
				email: "recipient@example.com",
				subject: "Subject",
				htmlBody: "Body",
				userId: "123",
			}),
		).rejects.toThrow("Email service not configured");
	});

	it("should fail if only accessKeyId is provided (without secret)", async () => {
		const provider = new SESProvider({
			...mockConfig,
			accessKeyId: "key-only",
			secretAccessKey: undefined,
		});

		// Expect constructor to throw or init to fail?
		// Looking at code: check happens in getSesArtifacts
		await expect(
			provider.sendEmail({
				id: "1",
				email: "to@example.com",
				subject: "S",
				htmlBody: "B",
				userId: "u",
			}),
		).resolves.toEqual(
			expect.objectContaining({
				success: false,
				error:
					"Both accessKeyId and secretAccessKey must be provided together, or neither should be set",
			}),
		);
	});

	it("should fail if only secretAccessKey is provided (without accessKeyId)", async () => {
		const provider = new SESProvider({
			...mockConfig,
			accessKeyId: undefined,
			secretAccessKey: "secret-only",
		});

		await expect(
			provider.sendEmail({
				id: "1",
				email: "to@example.com",
				subject: "S",
				htmlBody: "B",
				userId: "u",
			}),
		).resolves.toEqual(
			expect.objectContaining({
				success: false,
				error:
					"Both accessKeyId and secretAccessKey must be provided together, or neither should be set",
			}),
		);
	});

	it("should use default credentials if none provided", async () => {
		const provider = new SESProvider({
			...mockConfig,
			accessKeyId: undefined,
			secretAccessKey: undefined,
		});

		// Trigger init
		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(SESClient).toHaveBeenCalledWith(
			expect.objectContaining({
				credentials: undefined,
			}),
		);
	});

	it("should format Source correctly without fromName", async () => {
		const provider = new SESProvider({
			...mockConfig,
			fromName: undefined,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(SendEmailCommand).toHaveBeenCalledWith(
			expect.objectContaining({
				Source: "test@example.com",
			}),
		);
	});

	it("should skip falsy jobs in bulk send", async () => {
		const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-id" });
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const jobs = [
			{
				id: "1",
				email: "r1@example.com",
				subject: "S1",
				htmlBody: "B1",
				userId: "u1",
			},

			undefined,
			{
				id: "2",
				email: "r2@example.com",
				subject: "S2",
				htmlBody: "B2",
				userId: "u2",
			},
		];

		// Remove the @ts-expect-error comment since we are testing sparse array handling logic directly
		const results = await sesProvider.sendBulkEmails(
			jobs as unknown as EmailJob[],
		);

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);
		expect(results[1]?.success).toBe(true);
		expect(mockSend).toHaveBeenCalledTimes(2);
	});

	it("should include textBody in email when provided", async () => {
		const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-text" });
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "HTML Body",
			textBody: "Text Body Content",
			userId: "123",
		};

		await sesProvider.sendEmail(job);

		expect(SendEmailCommand).toHaveBeenCalledWith(
			expect.objectContaining({
				Message: expect.objectContaining({
					Body: expect.objectContaining({
						Text: { Data: "Text Body Content", Charset: "UTF-8" },
					}),
				}),
			}),
		);
	});

	it("should wait ~100ms between bulk emails", async () => {
		// Using real timers to avoid race conditions with dynamic imports + fake timers
		const mockSend = vi.fn().mockResolvedValue({ MessageId: "msg-id" });
		(SESClient as unknown as Mock).prototype.send = mockSend;

		const jobs = [
			{ id: "1", email: "e1@x.com", subject: "s", htmlBody: "b", userId: "u1" },
			{ id: "2", email: "e2@x.com", subject: "s", htmlBody: "b", userId: "u2" },
		];

		const start = Date.now();
		await sesProvider.sendBulkEmails(jobs);
		const end = Date.now();

		expect(mockSend).toHaveBeenCalledTimes(2);
		// Should be at least 100ms (1 delay)
		expect(end - start).toBeGreaterThanOrEqual(95); // Allow small margin for timer imprecision
	});
});
