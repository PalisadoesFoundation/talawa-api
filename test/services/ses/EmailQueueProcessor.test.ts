import type { FastifyBaseLogger } from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { EmailQueueProcessor } from "~/src/services/ses/EmailQueueProcessor";
import { EmailService } from "~/src/services/ses/EmailService";

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
	let emailService: EmailService;
	let processor: EmailQueueProcessor;

	beforeEach(() => {
		rows = [];
		emailService = new EmailService({
			region: "us-east-1",
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

		const logger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
			trace: vi.fn(),
			fatal: vi.fn(),
			child: () => logger,
		} as unknown as FastifyBaseLogger;

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
});
