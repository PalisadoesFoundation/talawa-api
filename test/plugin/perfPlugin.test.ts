import Fastify from "fastify";
import perfPlugin from "src/fastifyPlugins/performance";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("perfPlugin – slow request logging", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	let app: ReturnType<typeof Fastify>;

	beforeEach(() => {
		app = Fastify({ logger: true });

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");
	});

	afterEach(async () => {
		await app.close();
		delete process.env.API_SLOW_REQUEST_MS;
	});

	it("logs a warning when request duration exceeds slow threshold", async () => {
		process.env.API_SLOW_REQUEST_MS = "10";

		await app.register(perfPlugin);

		app.get("/slow", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/slow" });

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				method: "GET",
				path: "/slow",
				slowThresholdMs: 10,
			}),
		);
	});

	it("does not log a warning for fast requests", async () => {
		process.env.API_SLOW_REQUEST_MS = "50";

		await app.register(perfPlugin);

		app.get("/fast", async () => {
			await new Promise((r) => setTimeout(r, 5));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/fast" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("uses default threshold (500ms) when env is not set", async () => {
		await app.register(perfPlugin);

		app.get("/default", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/default" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("logs slow request when exceeding default 500ms threshold", async () => {
		await app.register(perfPlugin);

		app.get("/very-slow", async () => {
			await new Promise((r) => setTimeout(r, 520));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/very-slow" });

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				method: "GET",
				path: "/very-slow",
				slowThresholdMs: 500,
			}),
		);
	});
});
