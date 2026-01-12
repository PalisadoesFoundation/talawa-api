import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { EmailQueueProcessor } from "~/src/services/email/EmailQueueProcessor";
import { SESProvider } from "~/src/services/email/providers/SESProvider";
import type { IEmailProvider, NonEmptyString } from "~/src/services/email/types";
import { createMockLogger } from "../../utilities/mockLogger";

type ProcessorWithPrivates = {
	isProcessing: boolean;
	ctx: Pick<GraphQLContext, "drizzleClient" | "log">;
};

interface FakeEmailRow {
	id: string;
	email: string;
	subject: string;
	htmlBody: string;
	userId: string;
	status: string; // pending | sent | failed
	retryCount: number | null;
	maxRetries: number;
	createdAt: Date;
	updatedAt: Date;
}

function buildRow(overrides: Partial<FakeEmailRow> = {}): FakeEmailRow {
	const now = new Date();
	return {
		id: overrides.id || crypto.randomUUID(),
		email: overrides.email || "user@example.com",
		subject: overrides.subject || "Hello",
		htmlBody: overrides.htmlBody || "<p>Hi</p>",
		userId: overrides.userId || "u1",
		status: overrides.status || "pending",
		retryCount: overrides.retryCount ?? 0,
		maxRetries: overrides.maxRetries ?? 3,
		createdAt: overrides.createdAt || now,
		updatedAt: overrides.updatedAt || now,
	};
}

describe("EmailQueueProcessor", () => {
	let rows: FakeEmailRow[];
	let emailService: IEmailProvider;
	let processor: EmailQueueProcessor;

	beforeEach(() => {
		rows = [];
		emailService = new SESProvider({
			region: "us-east-1" as NonEmptyString,
			fromEmail: "noreply@example.com",
		});
		vi.spyOn(emailService, "sendBulkEmails").mockImplementation(
			async (jobs) => {
				return jobs.map((j) => ({
					id: j.id,
					success: true,
					messageId: `m-${j.id}`,
				}));
			},
		);

		const fakeDb = {
			query: {
				emailNotificationsTable: {
					findMany: vi.fn(async () =>
						rows.filter((r) => r.status === "pending").slice(0, 10),
					),
				},
			},
			update: () => ({
				set: () => ({
					where: () => Promise.resolve(),
				}),
			}),
		};

		const logger = createMockLogger();

		const ctxSubset = {
			drizzleClient: fakeDb as unknown as GraphQLContext["drizzleClient"],
			log: logger,
		} satisfies Pick<GraphQLContext, "drizzleClient" | "log">;

		processor = new EmailQueueProcessor(emailService, ctxSubset);
	});

	it("does nothing when no pending emails", async () => {
		const spy = vi.spyOn(emailService, "sendBulkEmails");
		await processor.processPendingEmails();
		expect(spy).not.toHaveBeenCalled();
	});

	it("processes pending emails", async () => {
		rows.push(buildRow({ id: "a" }), buildRow({ id: "b" }));
		const spy = vi.spyOn(emailService, "sendBulkEmails");
		await processor.processPendingEmails();
		expect(spy).toHaveBeenCalledTimes(1);
		const firstCall = spy.mock.calls[0];
		if (!firstCall) throw new Error("sendBulkEmails not called");
		const argJobs = firstCall[0];
		expect(argJobs.map((j: { id: string }) => j.id)).toEqual(["a", "b"]);
	});

	it("start/stop background processing manages interval", async () => {
		vi.useFakeTimers();
		const spy = vi.spyOn(processor, "processPendingEmails").mockResolvedValue();
		processor.startBackgroundProcessing(1000);
		vi.advanceTimersByTime(3100);
		processor.stopBackgroundProcessing();
		const countAtStop = spy.mock.calls.length;
		vi.advanceTimersByTime(5000);
		expect(spy.mock.calls.length).toBe(countAtStop);
		vi.useRealTimers();
	});

	it("handles early return when already processing (lines 30-31)", async () => {
		(processor as unknown as ProcessorWithPrivates).isProcessing = true;

		const spy = vi.spyOn(emailService, "sendBulkEmails");
		await processor.processPendingEmails();

		expect(spy).not.toHaveBeenCalled();

		(processor as unknown as ProcessorWithPrivates).isProcessing = false;
	});

	it("handles email sending failures (lines 82-83)", async () => {
		rows.push(buildRow({ id: "fail-email", retryCount: 0, maxRetries: 3 }));

		vi.spyOn(emailService, "sendBulkEmails").mockResolvedValueOnce([
			{
				id: "fail-email",
				success: false,
				error: "SMTP connection failed",
			},
		]);

		const updateSpy = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
		(processor as unknown as ProcessorWithPrivates).ctx.drizzleClient.update =
			updateSpy;

		await processor.processPendingEmails();

		expect(updateSpy).toHaveBeenCalled();
	});

	it("handles errors during email processing (line 90)", async () => {
		rows.push(buildRow({ id: "error-email" }));

		vi.spyOn(emailService, "sendBulkEmails").mockRejectedValueOnce(
			new Error("Database connection lost"),
		);

		const logSpy = vi.spyOn(
			(processor as unknown as ProcessorWithPrivates).ctx.log,
			"error",
		);

		await processor.processPendingEmails();

		expect(logSpy).toHaveBeenCalledWith(
			expect.any(Error),
			"Error processing email queue:",
		);
	});

	it("handles email failure with retry logic - increment retry count (lines 100-127)", async () => {
		const email = buildRow({ id: "retry-email", retryCount: 1, maxRetries: 3 });
		rows.push(email);

		vi.spyOn(emailService, "sendBulkEmails").mockResolvedValueOnce([
			{
				id: "retry-email",
				success: false,
				error: "Temporary network error",
			},
		]);

		const updateSpy = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
		(processor as unknown as ProcessorWithPrivates).ctx.drizzleClient.update =
			updateSpy;

		await processor.processPendingEmails();

		const setCall = updateSpy().set;
		expect(setCall).toHaveBeenCalledWith({
			retryCount: 2,
			errorMessage: "Temporary network error",
			updatedAt: expect.any(Date),
		});
	});

	it("handles email failure when max retries reached (lines 100-127)", async () => {
		const email = buildRow({
			id: "max-retry-email",
			retryCount: 2,
			maxRetries: 3,
		});
		rows.push(email);

		vi.spyOn(emailService, "sendBulkEmails").mockResolvedValueOnce([
			{
				id: "max-retry-email",
				success: false,
				error: "Permanent delivery failure",
			},
		]);

		const updateSpy = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
		(processor as unknown as ProcessorWithPrivates).ctx.drizzleClient.update =
			updateSpy;

		await processor.processPendingEmails();

		const setCall = updateSpy().set;
		expect(setCall).toHaveBeenCalledWith({
			status: "failed",
			errorMessage: "Permanent delivery failure",
			failedAt: expect.any(Date),
			updatedAt: expect.any(Date),
		});
	});

	it("handles error in background processing tick (line 136)", async () => {
		const mockError = new Error("Background processing error");
		vi.spyOn(processor, "processPendingEmails").mockRejectedValue(mockError);

		const logSpy = vi.spyOn(
			(processor as unknown as ProcessorWithPrivates).ctx.log,
			"error",
		);

		processor.startBackgroundProcessing(10);

		await new Promise((resolve) => setTimeout(resolve, 50));

		processor.stopBackgroundProcessing();

		expect(logSpy).toHaveBeenCalledWith(
			{ err: mockError },
			"Email queue tick failed",
		);
	});

	it("handles email with null retry count (lines 100-127)", async () => {
		const email = buildRow({
			id: "null-retry-email",
			retryCount: null,
			maxRetries: 3,
		});
		rows.push(email);

		vi.spyOn(emailService, "sendBulkEmails").mockResolvedValueOnce([
			{
				id: "null-retry-email",
				success: false,
				error: "Network timeout",
			},
		]);

		const updateSpy = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
		(processor as unknown as ProcessorWithPrivates).ctx.drizzleClient.update =
			updateSpy;

		await processor.processPendingEmails();

		const setCall = updateSpy().set;
		expect(setCall).toHaveBeenCalledWith({
			retryCount: 1,
			errorMessage: "Network timeout",
			updatedAt: expect.any(Date),
		});
	});

	it("handles email failure with undefined error (lines 82-83)", async () => {
		rows.push(
			buildRow({ id: "undefined-error", retryCount: 0, maxRetries: 3 }),
		);

		vi.spyOn(emailService, "sendBulkEmails").mockResolvedValueOnce([
			{
				id: "undefined-error",
				success: false,
			},
		]);

		const updateSpy = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockResolvedValue(undefined),
			}),
		});
		(processor as unknown as ProcessorWithPrivates).ctx.drizzleClient.update =
			updateSpy;

		await processor.processPendingEmails();

		const setCall = updateSpy().set;
		expect(setCall).toHaveBeenCalledWith({
			retryCount: 1,
			errorMessage: "Unknown error",
			updatedAt: expect.any(Date),
		});
	});

	it("prevents starting background processing twice", async () => {
		vi.useFakeTimers();

		const logSpy = vi.spyOn(
			(processor as unknown as ProcessorWithPrivates).ctx.log,
			"info",
		);

		processor.startBackgroundProcessing(1000);
		processor.startBackgroundProcessing(1000);

		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledWith(
			"Email queue processor started with 1000ms interval",
		);

		processor.stopBackgroundProcessing();
		vi.useRealTimers();
	});

	it("handles stopping background processing when not started", () => {
		const logSpy = vi.spyOn(
			(processor as unknown as ProcessorWithPrivates).ctx.log,
			"info",
		);

		processor.stopBackgroundProcessing();

		expect(logSpy).not.toHaveBeenCalledWith("Email queue processor stopped");
	});
});
