import Fastify, { type FastifyInstance } from "fastify";
import { describe, expect, it } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

// Mock fastify-plugin just in case, though usually works with actual fastify instance
// helper to register plugin
const registerPlugin = async (app: FastifyInstance) => {
	await app.register(errorHandlerPlugin);
};

describe("errorHandlerPlugin", () => {
	it("returns unified payload with correlationId", async () => {
		const app = Fastify();
		await registerPlugin(app);

		app.get("/boom", async () => {
			throw new TalawaRestError({
				code: ErrorCode.NOT_FOUND,
				message: "Missing",
				details: { id: "x" },
			});
		});

		try {
			const res = await app.inject({ method: "GET", url: "/boom" });
			expect(res.statusCode).toBe(404);
			const body = res.json();
			expect(body.error.code).toBe("not_found");
			expect(body.error.message).toBe("Missing");
			expect(body.error.details).toEqual({ id: "x" });
			expect(body.error.correlationId).toBeDefined();
			expect(typeof body.error.correlationId).toBe("string");
			expect(body.error.correlationId.length).toBeGreaterThan(0);
		} finally {
			await app.close();
		}
	});

	it("handles generic errors as 500", async () => {
		const app = Fastify();
		await registerPlugin(app);

		app.get("/fail", async () => {
			throw new Error("Whoops");
		});

		try {
			const res = await app.inject({ method: "GET", url: "/fail" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe("internal_server_error");
			expect(body.error.message).toBe("Whoops");
		} finally {
			await app.close();
		}
	});

	it("handles Zod validation errors (simulated)", async () => {
		const app = Fastify();
		await registerPlugin(app);

		const { ZodError, ZodIssueCode } = await import("zod");

		app.get("/zod", async () => {
			throw new ZodError([
				{
					code: ZodIssueCode.invalid_type,
					expected: "string",
					received: "number",
					path: ["body", "title"],
					message: "Expected string, received number",
				},
			]);
		});

		try {
			const res = await app.inject({ method: "GET", url: "/zod" });
			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.error.code).toBe("invalid_arguments");
			expect(body.error.message).toBe("Invalid input");
		} finally {
			await app.close();
		}
	});
});
