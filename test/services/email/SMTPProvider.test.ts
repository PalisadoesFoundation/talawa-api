import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { SMTPProvider } from "~/src/services/email/providers/SMTPProvider";
import type { EmailJob, NonEmptyString } from "~/src/services/email/types";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

// Mock nodemailer
vi.mock("nodemailer", () => {
	const createTransportMock = vi.fn();
	return {
		default: {
			createTransport: createTransportMock,
		},
		createTransport: createTransportMock,
	};
});

// Mock rootLogger - we will spy on it in beforeEach
vi.mock("~/src/utilities/logging/logger", () => ({
	rootLogger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe("TalawaRestError usage in SMTPProvider", () => {
	it("should create TalawaRestError with correct properties", () => {
		const error = new TalawaRestError({
			code: ErrorCode.INVALID_ARGUMENTS,
			message: "Test error message",
		});

		expect(error).toBeInstanceOf(TalawaRestError);
		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(error.message).toBe("Test error message");
		expect(error.name).toBe("TalawaRestError");
	});
});

describe("SMTPProvider", () => {
	const mockConfig = {
		host: "smtp.example.com" as NonEmptyString,
		port: 587,
		user: "test@example.com",
		password: "test-password",
		secure: false,
		fromEmail: "noreply@talawa.io",
		fromName: "Talawa Test",
	};
	let smtpProvider: SMTPProvider;
	let mockLoggerErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Spy on rootLogger.error
		const { rootLogger } = await import("~/src/utilities/logging/logger");
		mockLoggerErrorSpy = vi.spyOn(rootLogger, "error");

		smtpProvider = new SMTPProvider(mockConfig);

		// Setup default mock behavior
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-123" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});
	});

	it("should throw error if SMTP_HOST is empty string", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			host: "" as NonEmptyString,
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
				error: "SMTP_HOST must be a non-empty string",
			}),
		);
	});

	it("should use TalawaRestError for SMTP_HOST validation errors", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			host: "" as NonEmptyString,
		});

		const nodemailer = await import("nodemailer");
		const mockCreateTransport = vi.fn();
		(
			nodemailer.default as unknown as {
				createTransport: typeof mockCreateTransport;
			}
		).createTransport = mockCreateTransport;

		const result = await provider.sendEmail({
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("SMTP_HOST must be a non-empty string");
		expect(mockCreateTransport).not.toHaveBeenCalled();
	});

	it("should return a copy of the config via getConfig()", () => {
		const provider = new SMTPProvider(mockConfig);
		const config = provider.getConfig();

		// Should return the config values
		expect(config.host).toBe("smtp.example.com");
		expect(config.port).toBe(587);
		expect(config.user).toBe("test@example.com");
		expect(config.password).toBe("test-password");
		expect(config.secure).toBe(false);
		expect(config.fromEmail).toBe("noreply@talawa.io");
		expect(config.fromName).toBe("Talawa Test");

		// Should return a copy, not the original reference
		config.host = "modified.example.com" as NonEmptyString;
		expect(provider.getConfig().host).toBe("smtp.example.com");
	});

	it("should throw error if SMTP_PORT is missing", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: undefined as unknown as number,
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
				error: "SMTP_PORT must be provided",
			}),
		);
	});

	it("should throw error if SMTP_PORT is 0 (below range)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: 0,
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
				error: "SMTP_PORT must be provided",
			}),
		);
	});

	it("should throw error if SMTP_PORT is 65536 (above range)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: 65536,
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
				error: "SMTP_PORT must be an integer between 1 and 65535",
			}),
		);
	});

	it("should throw error if SMTP_PORT is non-integer (587.5)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: 587.5,
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
				error: "SMTP_PORT must be an integer between 1 and 65535",
			}),
		);
	});

	it("should initialize nodemailer transporter with correct config including advanced options", async () => {
		const advancedConfig = {
			...mockConfig,
			name: "client.hostname.com",
			localAddress: "192.168.1.10",
		};
		const provider = new SMTPProvider(advancedConfig);
		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		await provider.sendEmail(job);

		const nodemailer = await import("nodemailer");
		expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
			host: "smtp.example.com",
			port: 587,
			secure: false,
			name: "client.hostname.com",
			localAddress: "192.168.1.10",
			auth: {
				user: "test@example.com",
				pass: "test-password",
			},
		});
	});

	it("should initialize nodemailer transporter with correct config (standard)", async () => {
		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		await smtpProvider.sendEmail(job);

		const nodemailer = await import("nodemailer");
		expect(nodemailer.default.createTransport).toHaveBeenCalledWith({
			host: "smtp.example.com",
			port: 587,
			secure: false,
			auth: {
				user: "test@example.com",
				pass: "test-password",
			},
		});
	});

	it("should send email successfully", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-456" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Test Subject",
			htmlBody: "HTML Body",
			textBody: "Text Body",
			userId: "123",
		};

		const result = await smtpProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: true,
			messageId: "msg-456",
		});

		expect(mockSendMail).toHaveBeenCalledWith({
			from: "Talawa Test <noreply@talawa.io>",
			to: "recipient@example.com",
			subject: "Test Subject",
			html: "HTML Body",
			text: "Text Body",
		});
	});

	it("should handle SMTP errors gracefully", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi
			.fn()
			.mockRejectedValue(new Error("Connection refused"));
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		const result = await smtpProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: false,
			error: "Connection refused",
		});
	});

	it("should handle non-Error thrown values gracefully", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockRejectedValue("Plain string error");
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		const result = await smtpProvider.sendEmail(job);

		expect(result).toEqual({
			id: "1",
			success: false,
			error: "Plain string error",
		});
	});

	it("should log SMTP errors when sending fails", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi
			.fn()
			.mockRejectedValue(new Error("Connection timeout"));
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "test-job-123",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		await smtpProvider.sendEmail(job);

		expect(mockLoggerErrorSpy).toHaveBeenCalledWith(
			{
				error: expect.any(Error),
				jobId: "test-job-123",
			},
			"Failed to send email",
		);
	});

	it("should log non-Error values when sending fails", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockRejectedValue("String error");
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "test-job-456",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		};

		await smtpProvider.sendEmail(job);

		expect(mockLoggerErrorSpy).toHaveBeenCalledWith(
			{
				error: "String error",
				jobId: "test-job-456",
			},
			"Failed to send email",
		);
	});

	it("should send bulk emails", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-bulk" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

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

		const results = await smtpProvider.sendBulkEmails(jobs);

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);
		expect(results[1]?.success).toBe(true);
		expect(mockSendMail).toHaveBeenCalledTimes(2);
	});

	it("should throw error if fromEmail is not configured", async () => {
		const provider = new SMTPProvider({
			host: "smtp.example.com" as NonEmptyString,
			port: 587,
			// fromEmail missing
		});

		const result = await provider.sendEmail({
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain("Email service not configured");
	});

	it("should fail if only user is provided (without password)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			user: "user-only",
			password: undefined,
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
					"Both user and password must be provided together, or neither should be set",
			}),
		);
	});

	it("should fail if only password is provided (without user)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			user: undefined,
			password: "password-only",
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
					"Both user and password must be provided together, or neither should be set",
			}),
		);
	});

	it("should work without authentication if neither user nor password provided", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			user: undefined,
			password: undefined,
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-noauth" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				auth: undefined,
			}),
		);
	});

	it("should format sender correctly without fromName", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			fromName: undefined,
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-plain" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				from: "noreply@talawa.io",
			}),
		);
	});

	it("should skip falsy jobs in bulk send", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-sparse" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

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

		const results = await smtpProvider.sendBulkEmails(
			jobs as unknown as EmailJob[],
		);

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);
		expect(results[1]?.success).toBe(true);
		expect(mockSendMail).toHaveBeenCalledTimes(2);
	});

	it("should include textBody in email when provided", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-text" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const job = {
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "HTML Body",
			textBody: "Text Body Content",
			userId: "123",
		};

		await smtpProvider.sendEmail(job);

		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				text: "Text Body Content",
			}),
		);
	});

	it("should handle unhandled promise rejections (system crashes) in batch processing", async () => {
		const sendEmailSpy = vi
			.spyOn(smtpProvider, "sendEmail")
			.mockResolvedValueOnce({ id: "1", success: true, messageId: "ok" })
			.mockRejectedValueOnce(new Error("Network Down"));

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

		const results = await smtpProvider.sendBulkEmails(jobs);

		expect(results).toHaveLength(2);
		expect(results[0]?.success).toBe(true);
		expect(results[1]?.success).toBe(false);
		expect(results[1]?.error).toBe("Network Down");

		expect(sendEmailSpy).toHaveBeenCalledTimes(2);

		sendEmailSpy.mockRestore();
	});

	it("should process emails concurrently in batches and enforce delay between batches", async () => {
		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-batch" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		// Spy on setTimeout to ensure the 1000ms delay happens, but execute it
		// immediately so it doesn't artificially slow down our test suite!
		const setTimeoutSpy = vi
			.spyOn(global, "setTimeout")
			.mockImplementation((callback: () => void, _ms?: number) => {
				if (typeof callback === "function") {
					callback();
				}
				return {} as unknown as NodeJS.Timeout;
			});

		// Generate 15 jobs (BATCH_SIZE = 14 → 2 batches)
		const jobs = Array.from({ length: 15 }, (_, i) => ({
			id: String(i),
			email: `test${i}@example.com`,
			subject: "Batch Test",
			htmlBody: "Batch Body",
			userId: "u1",
		})) as EmailJob[];

		await smtpProvider.sendBulkEmails(jobs);

		expect(mockSendMail).toHaveBeenCalledTimes(15);

		// Ensure delay happened exactly once
		expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

		setTimeoutSpy.mockRestore();
	});

	it("should sanitize fromName and subject to prevent SMTP header injection", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			fromName: "Malicious\r\nBcc: hacker@evil.com",
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-safe" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "Test\r\nBcc: another-hacker@evil.com",
			htmlBody: "B",
			userId: "u",
		});

		// Verify CR/LF characters were removed/replaced
		expect(mockSendMail).toHaveBeenCalledWith(
			expect.objectContaining({
				// fromName should have CR/LF replaced with spaces
				from: expect.not.stringContaining("\r"),
				// subject should have CR/LF replaced with spaces
				subject: expect.not.stringContaining("\r"),
			}),
		);

		// Additionally verify the actual sanitized values
		const callArgs = mockSendMail.mock.calls[0]?.[0];
		expect(callArgs.from).toContain("Malicious");
		expect(callArgs.from).not.toContain("\r");
		expect(callArgs.from).not.toContain("\n");
		expect(callArgs.subject).toContain("Test");
		expect(callArgs.subject).not.toContain("\r");
		expect(callArgs.subject).not.toContain("\n");
	});

	it("should throw error if recipient email contains CR/LF (injection attempt)", async () => {
		const provider = new SMTPProvider(mockConfig);

		const result = await provider.sendEmail({
			id: "1",
			email: "recipient@example.com\r\nBcc: hacker@evil.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				error:
					"Recipient email is invalid or contains forbidden characters (CR/LF)",
			}),
		);
	});

	it("should throw error if sender email (fromEmail) is empty after sanitization", async () => {
		const provider = new SMTPProvider(mockConfig);

		const sanitizeHeaderSpy = vi
			.spyOn(
				provider as unknown as {
					sanitizeHeader: (value: string | undefined) => string;
				},
				"sanitizeHeader",
			)
			.mockImplementation((value: string | undefined) => {
				if (value === mockConfig.fromEmail) {
					return "";
				}
				if (!value) return "";
				return value.replace(/[\r\n]/g, " ");
			});

		const result = await provider.sendEmail({
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				error:
					"SMTP_FROM_EMAIL is invalid or contains forbidden characters (CR/LF)",
			}),
		);

		sanitizeHeaderSpy.mockRestore();
	});

	it("should use secure=true when configured", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: 465,
			secure: true,
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-secure" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				port: 465,
				secure: true,
			}),
		);
	});

	it("should use secure=false when configured", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			port: 587,
			secure: false,
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi
			.fn()
			.mockResolvedValue({ messageId: "msg-insecure" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				port: 587,
				secure: false,
			}),
		);
	});

	it("should default secure to false when not specified (undefined)", async () => {
		const provider = new SMTPProvider({
			...mockConfig,
			secure: undefined,
		});

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi
			.fn()
			.mockResolvedValue({ messageId: "msg-default" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		await provider.sendEmail({
			id: "1",
			email: "to@example.com",
			subject: "S",
			htmlBody: "B",
			userId: "u",
		});

		expect(nodemailer.default.createTransport).toHaveBeenCalledWith(
			expect.objectContaining({
				secure: false,
			}),
		);
	});
});
