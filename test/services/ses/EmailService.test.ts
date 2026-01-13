import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type EmailJob, EmailService } from "~/src/services/ses/EmailService";

// Hoist mocks to be available in vi.mock
const { mockSend, mockSESClientCtor, mockSendEmailCommandCtor } = vi.hoisted(
	() => ({
		mockSend: vi.fn(),
		mockSESClientCtor: vi.fn(),
		mockSendEmailCommandCtor: vi.fn(),
	}),
);

// Mock AWS SDK at top level
vi.mock("@aws-sdk/client-ses", () => {
	return {
		SESClient: class {
			constructor(config: unknown) {
				mockSESClientCtor(config);
			}
			send(cmd: unknown) {
				return mockSend(cmd);
			}
		},
		SendEmailCommand: class {
			constructor(input: unknown) {
				mockSendEmailCommandCtor(input);
				return { input, __cmd: true };
			}
		},
	};
});

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
		...(overrides.textBody ? { textBody: overrides.textBody } : {}),
	};
}

describe("EmailService", () => {
	let service: EmailService;

	beforeEach(() => {
		service = new EmailService(config);
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends a single email successfully", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "mid-123" });
		// We spy on getSesArtifacts to bypass the mocked AWS SDK module logic for this test
		// and verify the service's internal handling of the returned client
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

	it("throws error when only accessKeyId is provided without secretAccessKey", async () => {
		const servicePartialCreds = new EmailService({
			region: "us-east-1",
			fromEmail: "test@example.com",
			accessKeyId: "AKIATEST123",
			// secretAccessKey intentionally omitted
		});

		const result = await servicePartialCreds.sendEmail(buildJob());

		expect(result.success).toBe(false);
		expect(result.error).toContain(
			"Both accessKeyId and secretAccessKey must be provided together",
		);
	});

	it("throws error when only secretAccessKey is provided without accessKeyId", async () => {
		const servicePartialCreds = new EmailService({
			region: "us-east-1",
			fromEmail: "test@example.com",
			// accessKeyId intentionally omitted
			secretAccessKey: "testSecretKey123",
		});

		const result = await servicePartialCreds.sendEmail(buildJob());

		expect(result.success).toBe(false);
		expect(result.error).toContain(
			"Both accessKeyId and secretAccessKey must be provided together",
		);
	});

	it("includes textBody in email message when provided", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "text-body-test" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		await service.sendEmail(
			buildJob({
				id: "with-text",
				textBody: "Plain text version of the email",
			}),
		);

		const callArg = sendMock.mock.calls[0]?.[0] as {
			input?: {
				Message?: {
					Body?: {
						Html?: { Data: string };
						Text?: { Data: string };
					};
				};
			};
		};

		expect(callArg?.input?.Message?.Body?.Html?.Data).toBe("<p>Body</p>");
		expect(callArg?.input?.Message?.Body?.Text?.Data).toBe(
			"Plain text version of the email",
		);
	});

	it("omits Text body when textBody is not provided", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "no-text-body" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		await service.sendEmail(buildJob({ id: "without-text" }));

		const callArg = sendMock.mock.calls[0]?.[0] as {
			input?: {
				Message?: {
					Body?: {
						Html?: { Data: string };
						Text?: { Data: string };
					};
				};
			};
		};

		expect(callArg?.input?.Message?.Body?.Html?.Data).toBe("<p>Body</p>");
		expect(callArg?.input?.Message?.Body?.Text).toBeUndefined();
	});

	it("sendBulkEmails skips undefined jobs in array", async () => {
		const sendMock = vi.fn().mockResolvedValue({ MessageId: "valid-job" });
		vi.spyOn(
			service as unknown as { getSesArtifacts: () => Promise<unknown> },
			"getSesArtifacts",
		).mockResolvedValue({
			client: { send: sendMock },
			SendEmailCommand: (input: unknown) => ({ __cmd: true, input }),
		});

		const jobs = [
			buildJob({ id: "first" }),
			undefined as unknown as EmailJob,
			buildJob({ id: "third" }),
		];

		const results = await service.sendBulkEmails(jobs);

		expect(results).toHaveLength(2);
		expect(results[0]?.id).toBe("first");
		expect(results[1]?.id).toBe("third");
		expect(sendMock).toHaveBeenCalledTimes(2);
	});
});

/**
 * Tests for getSesArtifacts method internals using the global mock
 */
describe("EmailService getSesArtifacts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes SES client with credentials when both accessKeyId and secretAccessKey are provided", async () => {
		mockSend.mockResolvedValue({ MessageId: "test-msg-id" });

		const serviceWithCreds = new EmailService({
			region: "us-west-2",
			fromEmail: "test@example.com",
			accessKeyId: "AKIAIOSFODNN7EXAMPLE",
			secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
		});

		const result = await serviceWithCreds.sendEmail(buildJob());

		expect(result.success).toBe(true);
		// Verify SESClient was called with credentials
		expect(mockSESClientCtor).toHaveBeenCalledWith({
			region: "us-west-2",
			credentials: {
				accessKeyId: "AKIAIOSFODNN7EXAMPLE",
				secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
			},
		});
	});

	it("initializes SES client without credentials when neither are provided (uses IAM role)", async () => {
		mockSend.mockResolvedValue({ MessageId: "iam-msg-id" });

		const serviceNoCreds = new EmailService({
			region: "eu-west-1",
			fromEmail: "no-creds@example.com",
			// No accessKeyId or secretAccessKey - uses IAM role
		});

		const result = await serviceNoCreds.sendEmail(buildJob());

		expect(result.success).toBe(true);
		// Verify SESClient was called with undefined credentials
		expect(mockSESClientCtor).toHaveBeenCalledWith({
			region: "eu-west-1",
			credentials: undefined,
		});
	});

	it("caches SES client and command constructor on subsequent calls", async () => {
		mockSend.mockResolvedValue({ MessageId: "cached-id" });

		const cachedService = new EmailService({
			region: "us-east-1",
			fromEmail: "cache@example.com",
		});

		// First call - initializes client
		await cachedService.sendEmail(buildJob({ id: "first" }));
		// Second call - should use cached client
		await cachedService.sendEmail(buildJob({ id: "second" }));

		// SESClient constructor should only be called once (cached)
		expect(mockSESClientCtor).toHaveBeenCalledTimes(1);
		// But send should be called twice
		expect(mockSend).toHaveBeenCalledTimes(2);
	});
});
