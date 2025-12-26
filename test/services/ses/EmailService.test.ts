import { beforeEach, describe, expect, it, vi } from "vitest";
import { type EmailJob, EmailService } from "~/src/services/ses/EmailService";

// Minimal config for tests
const config = {
	region: "us-east-1",
	fromEmail: "noreply@example.com",
	fromName: "Test Sender",
};

// Helper to build a job
function buildJob(overrides: Partial<EmailJob> = {}): EmailJob {
	return {
		id: overrides.id || "job-1",
		email: overrides.email || "user@example.com",
		subject: overrides.subject || "Subject",
		htmlBody: overrides.htmlBody || "<p>Body</p>",
		userId: overrides.userId || "user-1",
	};
}

describe("EmailService", () => {
	let service: EmailService;

	beforeEach(() => {
		service = new EmailService(config);
	});

	it("sends a single email successfully", async () => {
		// Mock dynamic import of @aws-sdk/client-ses
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "mid-123" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const result = await service.sendEmail(buildJob());

		expect(result).toEqual({
			id: "job-1",
			success: true,
			messageId: "mid-123",
		});
		expect(sendMock).toHaveBeenCalledTimes(1);
	});

	it("returns failure when send throws", async () => {
		const sendMock = vi.fn().mockRejectedValue(new Error("boom"));
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const result = await service.sendEmail(buildJob({ id: "fail" }));
		expect(result.success).toBe(false);
		expect(result.id).toBe("fail");
		expect(result.error).toContain("boom");
	});

	it("sendBulkEmails processes jobs sequentially and waits between sends", async () => {
		const sendMock = vi
			.fn()
			.mockResolvedValueOnce({ MessageId: "m1" })
			.mockResolvedValueOnce({ MessageId: "m2" });

		vi.spyOn(global, "setTimeout").mockImplementation(((
			cb: (...args: unknown[]) => void,
		) => {
			cb();
			return 0 as unknown as NodeJS.Timeout;
		}) as unknown as typeof setTimeout);

		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const jobs = [buildJob({ id: "a" }), buildJob({ id: "b" })];
		const results = await service.sendBulkEmails(jobs);

		expect(results).toHaveLength(2);
		expect(results[0]).toMatchObject({
			id: "a",
			success: true,
			messageId: "m1",
		});
		expect(results[1]).toMatchObject({
			id: "b",
			success: true,
			messageId: "m2",
		});
		expect(sendMock).toHaveBeenCalledTimes(2);
	});

	it("returns error when fromEmail is not configured", async () => {
		const serviceNoFrom = new EmailService({ region: "us-east-1" });
		const result = await serviceNoFrom.sendEmail(buildJob());

		expect(result.success).toBe(false);
		expect(result.error).toContain("fromEmail is required");
	});

	it("uses fromEmail directly when fromName is not provided", async () => {
		const serviceNoName = new EmailService({
			region: "us-east-1",
			fromEmail: "direct@example.com",
		});

		const sendMock = vi.fn().mockResolvedValue({ MessageId: "mid-direct" });
		vi.spyOn(
			serviceNoName as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const result = await serviceNoName.sendEmail(buildJob());

		expect(result.success).toBe(true);
		// Verify the Source is just the email without a name prefix
		const callArg = sendMock.mock.calls[0]?.[0] as {
			input?: { Source?: string };
		};
		expect(callArg?.input?.Source).toBe("direct@example.com");
	});

	it("formats fromAddress with name when fromName is provided", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "mid-name" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		await service.sendEmail(buildJob());

		const callArg = sendMock.mock.calls[0]?.[0] as {
			input?: { Source?: string };
		};
		expect(callArg?.input?.Source).toBe("Test Sender <noreply@example.com>");
	});

	it("sendBulkEmails handles empty jobs array", async () => {
		const results = await service.sendBulkEmails([]);
		expect(results).toEqual([]);
	});

	it("sendBulkEmails handles single job without waiting", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "single" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const results = await service.sendBulkEmails([buildJob({ id: "only" })]);

		expect(results).toHaveLength(1);
		expect(results[0]?.success).toBe(true);
		expect(sendMock).toHaveBeenCalledTimes(1);
	});
});
