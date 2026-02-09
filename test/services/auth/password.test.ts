import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "~/src/services/auth";

describe("auth/password", () => {
	describe("hashPassword", () => {
		it("produces a hash that verifyPassword accepts (round-trip)", async () => {
			const plain = "my-secure-password";
			const hashStr = await hashPassword(plain);
			expect(hashStr).toBeTruthy();
			expect(typeof hashStr).toBe("string");
			expect(hashStr.startsWith("$argon2id$")).toBe(true);

			const ok = await verifyPassword(hashStr, plain);
			expect(ok).toBe(true);
		});

		it("produces a hash for empty string that verifies correctly", async () => {
			const plain = "";
			const hashStr = await hashPassword(plain);
			expect(hashStr).toBeTruthy();
			expect(await verifyPassword(hashStr, plain)).toBe(true);
		});
	});

	describe("verifyPassword", () => {
		it("returns false for wrong password", async () => {
			const plain = "correct-password";
			const hashStr = await hashPassword(plain);
			const ok = await verifyPassword(hashStr, "wrong-password");
			expect(ok).toBe(false);
		});

		it("returns false for invalid hash without throwing", async () => {
			const ok = await verifyPassword(
				"not-a-valid-argon2-hash",
				"any-password",
			);
			expect(ok).toBe(false);
		});

		it("returns false for malformed hash prefix", async () => {
			const ok = await verifyPassword("$argon2id$garbage", "any");
			expect(ok).toBe(false);
		});
	});
});
