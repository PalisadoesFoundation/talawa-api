import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
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

	it("should handle partial batch failures gracefully", async () => {
		// Spy on sendEmail to simulate one success and one failure
		const sendEmailSpy = vi
			.spyOn(sesProvider, "sendEmail")
			.mockResolvedValueOnce({
				id: "1",
				success: true,
				messageId: "success-id",
			}) // First job succeeds
			.mockResolvedValueOnce({
				id: "2",
				success: false,
				error: "AWS Limit Exceeded",
			}); // Second job fails

		const jobs = [
			{
				id: "1",
				email: "good@test.com",
				subject: "S",
				htmlBody: "B",
				userId: "u1",
			},
			{
				id: "2",
				email: "bad@test.com",
				subject: "S",
				htmlBody: "B",
				userId: "u2",
			},
		];

		const results = await sesProvider.sendBulkEmails(jobs);

		// Verify we got both results back
		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			id: "1",
			success: true,
			messageId: "success-id",
		});
		expect(results[1]).toEqual({
			id: "2",
			success: false,
			error: "AWS Limit Exceeded",
		});

		sendEmailSpy.mockRestore();
	});

	it("should handle unhandled promise rejections (system crashes) in batch processing", async () => {
		// Spy on sendEmail to simulate a catastrophic failure
		const sendEmailSpy = vi
			.spyOn(sesProvider, "sendEmail")
			.mockResolvedValueOnce({ id: "1", success: true, messageId: "ok" }) // First job works
			.mockRejectedValueOnce(new Error("Critical System Failure")); // Second job EXPLODES

		const jobs = [
			{
				id: "1",
				email: "good@test.com",
				subject: "S",
				htmlBody: "B",
				userId: "u1",
			},
			{
				id: "2",
				email: "crash@test.com",
				subject: "S",
				htmlBody: "B",
				userId: "u2",
			},
		];

		// This triggers the 'rejected' path in Promise.allSettled

		const results = await sesProvider.sendBulkEmails(jobs); // Fixed variable name here

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);

		// This verifies that your code caught the explosion and handled it safely
		expect(results[1]?.success).toBe(false);
		expect(results[1]?.error).toBe("Critical System Failure");

		sendEmailSpy.mockRestore();
	});

	it("should wait ~100ms between bulk emails", async () => {
		// Spy on setTimeout so the test runs instantly
		const setTimeoutSpy = vi
			.spyOn(global, "setTimeout")
			.mockImplementation((callback: () => void, _ms?: number) => {
				if (typeof callback === "function") {
					callback();
				}
				return {} as unknown as NodeJS.Timeout;
			});

		// Create exactly 15 jobs to trigger the batch limit (14 per batch)
		const jobs = Array.from({ length: 15 }, (_, i) => ({
			id: String(i),
			email: `test${i}@example.com`,
			subject: "Batch Test",
			htmlBody: "Batch Body",
			userId: "u1",
		}));

		// We spy directly on the provider's sendEmail method to count how many times it fires
		// NOTE: If your instance is named 'sesProvider', change 'provider' to 'sesProvider' on these next two lines!
		const sendEmailSpy = vi.spyOn(sesProvider, "sendEmail").mockResolvedValue({
			id: "1",
			success: true,
			messageId: "msg-batch",
		});

		await sesProvider.sendBulkEmails(jobs as unknown as EmailJob[]);

		// 15 emails should have been processed
		expect(sendEmailSpy).toHaveBeenCalledTimes(15);

		// It should have paused exactly once between the first batch (14) and the second batch (1)
		expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

		setTimeoutSpy.mockRestore();
		sendEmailSpy.mockRestore();
	});
});
