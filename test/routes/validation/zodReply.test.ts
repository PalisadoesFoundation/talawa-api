import type { FastifyReply } from "fastify";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zReplyParsed } from "~/src/routes/validation/zodReply";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

type MockReply = FastifyReply & {
	statusCode: number;
	sentPayload: unknown;
};

function createMockReply(
	requestOverride: { id?: string | number } = { id: "test-id" },
): MockReply {
	const reply = {
		request: requestOverride,
		statusCode: 0,
		sentPayload: undefined as unknown,
		status(code: number) {
			this.statusCode = code;
			return this;
		},
		send(payload: unknown) {
			this.sentPayload = payload;
			return this;
		},
	};
	return reply as unknown as MockReply;
}

const numberSchema = z.object({ x: z.number() });

describe("zReplyParsed", () => {
	it("returns parsed value for valid body and does not call status or send", () => {
		const reply = createMockReply();
		const result = zReplyParsed(reply, numberSchema, { x: 1 });
		expect(result).toEqual({ x: 1 });
		expect(reply.statusCode).toBe(0);
		expect(reply.sentPayload).toBeUndefined();
	});

	it("returns undefined and sends 400 with error payload for invalid body (wrong type)", () => {
		const reply = createMockReply();
		const result = zReplyParsed(reply, numberSchema, { x: "not a number" });
		expect(result).toBeUndefined();
		expect(reply.statusCode).toBe(400);
		expect(reply.sentPayload).toEqual({
			error: {
				code: ErrorCode.INVALID_ARGUMENTS,
				message: expect.any(String),
				details: expect.any(Object),
				correlationId: "test-id",
			},
		});
		const payload = reply.sentPayload as {
			error: { message: string; details: unknown };
		};
		expect(payload.error.message.length).toBeGreaterThan(0);
		expect(payload.error.details).toBeDefined();
	});

	it("returns undefined and sends 400 for null body", () => {
		const reply = createMockReply();
		const result = zReplyParsed(reply, numberSchema, null);
		expect(result).toBeUndefined();
		expect(reply.statusCode).toBe(400);
		const payload = reply.sentPayload as {
			error: { code: string; correlationId: string };
		};
		expect(payload.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(payload.error.correlationId).toBe("test-id");
	});

	it("returns undefined and sends 400 for undefined body", () => {
		const reply = createMockReply();
		const result = zReplyParsed(reply, numberSchema, undefined);
		expect(result).toBeUndefined();
		expect(reply.statusCode).toBe(400);
		const payload = reply.sentPayload as {
			error: { code: string; correlationId: string };
		};
		expect(payload.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(payload.error.correlationId).toBe("test-id");
	});

	it("sends 400 without correlationId when reply.request.id is not a string", () => {
		const reply = createMockReply({ id: 123 });
		const result = zReplyParsed(reply, numberSchema, null);
		expect(result).toBeUndefined();
		expect(reply.statusCode).toBe(400);
		const payload = reply.sentPayload as {
			error: { code: string; correlationId?: string };
		};
		expect(payload.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(payload.error.correlationId).toBeUndefined();
	});
});
