import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("scripts/setup/envFileManager", () => ({
	updateEnvVariable: vi.fn(),
}));

describe("scripts/setup/updateEnvVariable wrapper", () => {
	const originalNodeEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalNodeEnv;
		vi.clearAllMocks();
	});

	it('defaults envFile to ".env_test" when NODE_ENV === "test"', async () => {
		process.env.NODE_ENV = "test";

		const { updateEnvVariable } = await import(
			"scripts/setup/updateEnvVariable"
		);
		await updateEnvVariable({ A: "1" });

		const { updateEnvVariable: inner } = await import(
			"scripts/setup/envFileManager"
		);
		expect(inner).toHaveBeenCalledWith(
			{ A: "1" },
			expect.objectContaining({ envFile: ".env_test" }),
		);
	});

	it('defaults envFile to ".env" when NODE_ENV is not "test"', async () => {
		process.env.NODE_ENV = "development";

		const { updateEnvVariable } = await import(
			"scripts/setup/updateEnvVariable"
		);
		await updateEnvVariable({ A: "1" });

		const { updateEnvVariable: inner } = await import(
			"scripts/setup/envFileManager"
		);
		expect(inner).toHaveBeenCalledWith(
			{ A: "1" },
			expect.objectContaining({ envFile: ".env" }),
		);
	});

	it("respects explicit envFile option", async () => {
		process.env.NODE_ENV = "test";

		const { updateEnvVariable } = await import(
			"scripts/setup/updateEnvVariable"
		);
		await updateEnvVariable({ A: "1" }, { envFile: "custom.env" });

		const { updateEnvVariable: inner } = await import(
			"scripts/setup/envFileManager"
		);
		expect(inner).toHaveBeenCalledWith(
			{ A: "1" },
			expect.objectContaining({ envFile: "custom.env" }),
		);
	});
});
