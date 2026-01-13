import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { SMTPProvider } from "~/src/services/email/providers/SMTPProvider";
import type { EmailJob, NonEmptyString } from "~/src/services/email/types";

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

	beforeEach(async () => {
		vi.clearAllMocks();
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

	it("should initialize nodemailer transporter with correct config", async () => {
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

	it("should wait ~100ms between bulk emails", async () => {
		vi.useFakeTimers();

		const nodemailer = await import("nodemailer");
		const mockSendMail = vi.fn().mockResolvedValue({ messageId: "msg-delay" });
		(nodemailer.default.createTransport as Mock).mockReturnValue({
			sendMail: mockSendMail,
		});

		const jobs = [
			{ id: "1", email: "e1@x.com", subject: "s", htmlBody: "b", userId: "u1" },
			{ id: "2", email: "e2@x.com", subject: "s", htmlBody: "b", userId: "u2" },
		];

		const bulkPromise = smtpProvider.sendBulkEmails(jobs);
		// Advance timers to cover the delay
		await vi.advanceTimersByTimeAsync(200);
		await bulkPromise;

		expect(mockSendMail).toHaveBeenCalledTimes(2);

		vi.useRealTimers();
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
});
