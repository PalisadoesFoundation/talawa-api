import nodemailer from "nodemailer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SMTPProvider } from "~/src/services/email/providers/SMTPProvider";
import type { NonEmptyString } from "~/src/services/email/types";

describe("SMTPProvider Integration (Nodemailer v7)", () => {
	let testAccount: Awaited<
		ReturnType<typeof nodemailer.createTestAccount>
	> | null = null;
	let provider: SMTPProvider | null = null;
	let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
	let canRunSMTP = true;

	beforeAll(async () => {
		try {
			testAccount = await nodemailer.createTestAccount();

			provider = new SMTPProvider({
				host: testAccount.smtp.host as NonEmptyString,
				port: testAccount.smtp.port,
				secure: testAccount.smtp.secure,
				user: testAccount.user,
				password: testAccount.pass,
				fromEmail: testAccount.user,
				fromName: "Talawa Integration",
			});

			transporter = nodemailer.createTransport({
				host: testAccount.smtp.host,
				port: testAccount.smtp.port,
				secure: testAccount.smtp.secure,
				auth: {
					user: testAccount.user,
					pass: testAccount.pass,
				},
			});
		} catch (err) {
			console.warn(
				"Skipping SMTP integration tests (Ethereal unavailable)",
				err,
			);
			canRunSMTP = false;
		}
	});

	afterAll(() => {
		if (transporter) {
			transporter.close();
		}
	});

	it("should send real email using Ethereal test account", async (ctx) => {
		if (!canRunSMTP || !provider || !testAccount) {
			ctx.skip();
			return;
		}

		const result = await provider.sendEmail({
			id: "integration-1",
			email: testAccount.user,
			subject: "Integration Test",
			htmlBody: "<b>Hello v7</b>",
			textBody: "Hello v7",
			userId: "u1",
		});

		expect(result.success).toBe(true);
		expect(typeof result.messageId).toBe("string");
		expect(result.messageId?.length).toBeGreaterThan(0);
	});

	it("should handle large Data URI attachment (nodemailer v7 sanity check)", async (ctx) => {
		if (!canRunSMTP || !transporter || !testAccount) {
			ctx.skip();
			return;
		}

		const largeBuffer = Buffer.alloc(200 * 1024, "a");
		const base64Data = largeBuffer.toString("base64");

		const info = await transporter.sendMail({
			from: testAccount.user,
			to: testAccount.user,
			subject: "Data URI Test",
			text: "Testing attachment",
			attachments: [
				{
					filename: "large.txt",
					path: `data:text/plain;base64,${base64Data}`,
				},
			],
		});

		expect(info.messageId).toBeDefined();
	});

	it("should handle repeated SMTP sends without DNS-related failures", async (ctx) => {
		if (!canRunSMTP || !provider || !testAccount) {
			ctx.skip();
			return;
		}

		for (let i = 0; i < 5; i++) {
			const result = await provider.sendEmail({
				id: `dns-test-${i}`,
				email: testAccount.user,
				subject: `DNS Stability Test ${i}`,
				htmlBody: "<p>Testing DNS resolution stability</p>",
				userId: "u1",
			});

			expect(result.success).toBe(true);
			expect(result.messageId).toBeDefined();
		}
	});

	it("should correctly handle complex recipient formats via provider", async (ctx) => {
		if (!canRunSMTP || !provider || !testAccount) {
			ctx.skip();
			return;
		}

		const result = await provider.sendEmail({
			id: "recipient-test",
			email: `"User One" <${testAccount.user}>, ${testAccount.user}`,
			subject: "Address Parsing Test",
			htmlBody: "<p>Testing address parser</p>",
			userId: "u1",
		});

		expect(result.success).toBe(true);
		expect(result.messageId).toBeDefined();
	});
	it("should reject CRLF injection in recipient field", async (ctx) => {
		if (!canRunSMTP || !provider || !testAccount) {
			ctx.skip();
			return;
		}

		const result = await provider.sendEmail({
			id: "recipient-injection-test",
			email: `${testAccount.user}\r\nBCC: evil@example.com`,
			subject: "Injection Test",
			htmlBody: "<p>Injection</p>",
			userId: "u1",
		});

		expect(result.success).toBe(false);
	});
});
