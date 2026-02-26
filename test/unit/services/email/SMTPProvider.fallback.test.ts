import { describe, expect, it, vi } from "vitest";
import {
	SMTPProvider,
	type SMTPProviderConfig,
} from "~/src/services/email/providers/SMTPProvider";

describe("SMTPProvider fallback coverage", () => {
	const mockConfig = {
		host: "smtp.example.com",
		port: 587,
		user: "test@example.com",
		password: "test-password",
		secure: false,
		fromEmail: "noreply@talawa.io",
		fromName: "Talawa Test",
	};

	it("should handle nodemailer module without default export", async () => {
		const mockTransporter = {
			sendMail: vi.fn().mockResolvedValue({ messageId: "msg-no-default" }),
		};
		const createTransport = vi.fn().mockReturnValue(mockTransporter);

		vi.doMock("nodemailer", () => {
			return {
				default: undefined,
				createTransport,
				__esModule: true,
			};
		});

		const provider = new SMTPProvider(mockConfig as SMTPProviderConfig);
		const result = await provider.sendEmail({
			id: "1",
			email: "recipient@example.com",
			subject: "Subject",
			htmlBody: "Body",
			userId: "123",
		});

		if (!result.success) {
			console.error("SMTPProvider fallback failed error:", result.error);
		}
		expect(result.success).toBe(true);
		expect(createTransport).toHaveBeenCalled();

		vi.doUnmock("nodemailer");
	});
});
