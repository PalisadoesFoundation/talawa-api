import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { EmailQueueProcessor } from "~/src/services/email/EmailQueueProcessor";
import {
	initializeEmailQueue,
	stopEmailQueue,
} from "~/src/services/email/emailServiceInstance";
import { createMockLogger } from "../../utilities/mockLogger";

// Mock dependencies
vi.mock("~/src/services/email/EmailQueueProcessor");

describe("emailServiceInstance", () => {
	const mockLogger = createMockLogger();
	const mockCtx = {
		drizzleClient: {} as unknown as GraphQLContext["drizzleClient"],
		log: mockLogger,
		envConfig: { API_ENABLE_EMAIL_QUEUE: true },
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset module state if possible, or rely on stopEmailQueue
		stopEmailQueue();
	});

	afterEach(() => {
		vi.clearAllMocks();
		stopEmailQueue();
	});

	it("should initialize email queue when enabled", () => {
		initializeEmailQueue(mockCtx);

		expect(EmailQueueProcessor).toHaveBeenCalledTimes(1);
		// Access the mock instance
		const mockInstance = vi.mocked(EmailQueueProcessor).mock.instances[0];
		expect(mockInstance?.startBackgroundProcessing).toHaveBeenCalled();
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Email queue processor initialized",
		);
	});

	it("should not initialize email queue when disabled via config", () => {
		const disabledCtx = {
			...mockCtx,
			envConfig: { API_ENABLE_EMAIL_QUEUE: false },
		};
		initializeEmailQueue(disabledCtx);

		expect(EmailQueueProcessor).not.toHaveBeenCalled();
		expect(mockLogger.info).toHaveBeenCalledWith(
			"Email queue disabled by API_ENABLE_EMAIL_QUEUE env var",
		);
	});

	it("should not re-initialize if already initialized", () => {
		initializeEmailQueue(mockCtx);
		initializeEmailQueue(mockCtx);

		expect(EmailQueueProcessor).toHaveBeenCalledTimes(1);
	});

	it("should stop email queue processor", () => {
		initializeEmailQueue(mockCtx);

		const mockInstance = vi.mocked(EmailQueueProcessor).mock.instances[0];
		const logSpy = vi.fn();

		stopEmailQueue({ info: logSpy });

		expect(mockInstance?.stopBackgroundProcessing).toHaveBeenCalled();
		expect(logSpy).toHaveBeenCalledWith(
			"Email queue processor stopped (stopEmailQueue)",
		);
	});

	it("should handle stop called when not initialized", () => {
		const logSpy = vi.fn();
		stopEmailQueue({ info: logSpy });
		expect(logSpy).not.toHaveBeenCalled();
	});
});

// Separate suite for Factory integration to handle module-level execution
describe("emailServiceInstance factory integration", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("should initialize emailService using EmailProviderFactory", async () => {
		// Mock the dependencies
		const mockProvider = { sendEmail: vi.fn(), sendBulkEmails: vi.fn() };
		const mockCreate = vi.fn().mockReturnValue(mockProvider);

		vi.doMock("~/src/services/email", () => ({
			EmailProviderFactory: { create: mockCreate },
		}));

		vi.doMock("~/src/config/emailConfig", () => ({
			rawEmailEnvConfig: {
				API_EMAIL_PROVIDER: "ses",
				API_AWS_SES_REGION: "us-east-1",
			},
		}));

		// Dynamically import the module under test
		const { emailService } = await import(
			"~/src/services/email/emailServiceInstance"
		);

		expect(mockCreate).toHaveBeenCalledWith({
			API_EMAIL_PROVIDER: "ses",
			API_AWS_SES_REGION: "us-east-1",
		});
		expect(emailService).toBe(mockProvider);
	});

	it("should throw error during initialization if factory fails", async () => {
		const mockCreate = vi.fn().mockImplementation(() => {
			throw new Error("Invalid config");
		});

		vi.doMock("~/src/services/email", () => ({
			EmailProviderFactory: { create: mockCreate },
		}));
		vi.doMock("~/src/config/emailConfig", () => ({
			rawEmailEnvConfig: { API_EMAIL_PROVIDER: "unknown" },
		}));

		await expect(
			import("~/src/services/email/emailServiceInstance"),
		).rejects.toThrow("Invalid config");
	});
});
