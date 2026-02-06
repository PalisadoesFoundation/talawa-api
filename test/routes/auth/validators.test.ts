import { describe, expect, it } from "vitest";
import {
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	refreshBody,
	signInBody,
	signUpBody,
} from "~/src/routes/auth/validators";

describe("signUpBody", () => {
	const valid = {
		email: "user@example.com",
		password: "password123",
		firstName: "Jane",
		lastName: "Doe",
	};

	it("accepts valid object with email, password 8+ chars, firstName, lastName", () => {
		const result = signUpBody.safeParse(valid);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(valid);
		}
	});

	it("rejects missing email", () => {
		const result = signUpBody.safeParse({
			...valid,
			email: undefined,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(
				true,
			);
		}
	});

	it("rejects missing password", () => {
		const result = signUpBody.safeParse({
			...valid,
			password: undefined,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("password"))).toBe(
				true,
			);
		}
	});

	it("rejects invalid email", () => {
		const result = signUpBody.safeParse({
			...valid,
			email: "not-an-email",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(
				true,
			);
		}
	});

	it("accepts password with exactly 8 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			password: "a".repeat(PASSWORD_MIN_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	it("accepts password with exactly 64 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			password: "a".repeat(PASSWORD_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	it("rejects password shorter than 8 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			password: "short",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const msg = result.error.issues[0]?.message ?? "";
			expect(msg).toContain(String(PASSWORD_MIN_LENGTH));
		}
	});

	it("rejects password longer than 64 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			password: "a".repeat(PASSWORD_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing firstName", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: undefined,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("firstName")),
			).toBe(true);
		}
	});

	it("rejects empty firstName", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects firstName with only whitespace", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing lastName", () => {
		const result = signUpBody.safeParse({
			...valid,
			lastName: undefined,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("lastName"))).toBe(
				true,
			);
		}
	});

	it("rejects empty lastName", () => {
		const result = signUpBody.safeParse({
			...valid,
			lastName: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects lastName with only whitespace", () => {
		const result = signUpBody.safeParse({
			...valid,
			lastName: "   ",
		});
		expect(result.success).toBe(false);
	});

	it("trims leading and trailing whitespace from firstName and lastName", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: " Jane ",
			lastName: " Doe ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.firstName).toBe("Jane");
			expect(result.data.lastName).toBe("Doe");
		}
	});

	it("accepts firstName with exactly 50 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: "a".repeat(NAME_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	it("accepts lastName with exactly 50 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			lastName: "a".repeat(NAME_MAX_LENGTH),
		});
		expect(result.success).toBe(true);
	});

	it("rejects firstName longer than 50 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			firstName: "a".repeat(NAME_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});

	it("rejects lastName longer than 50 characters", () => {
		const result = signUpBody.safeParse({
			...valid,
			lastName: "a".repeat(NAME_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});
});

describe("signInBody", () => {
	const valid = { email: "user@example.com", password: "secret" };

	it("accepts valid object with email and password", () => {
		const result = signInBody.safeParse(valid);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(valid);
		}
	});

	it("accepts minimum-length password (1 character)", () => {
		const input = { email: valid.email, password: "a" };
		const result = signInBody.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(input);
		}
	});

	it("accepts maximum-length password", () => {
		const input = {
			email: valid.email,
			password: "a".repeat(PASSWORD_MAX_LENGTH),
		};
		const result = signInBody.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(input);
		}
	});

	it("rejects missing email", () => {
		const result = signInBody.safeParse({
			password: valid.password,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(
				true,
			);
		}
	});

	it("rejects invalid email", () => {
		const result = signInBody.safeParse({
			...valid,
			email: "bad",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing password", () => {
		const result = signInBody.safeParse({
			email: valid.email,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes("password"))).toBe(
				true,
			);
		}
	});

	it("rejects empty password", () => {
		const result = signInBody.safeParse({
			...valid,
			password: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password longer than PASSWORD_MAX_LENGTH characters", () => {
		const result = signInBody.safeParse({
			...valid,
			password: "a".repeat(PASSWORD_MAX_LENGTH + 1),
		});
		expect(result.success).toBe(false);
	});
});

describe("refreshBody", () => {
	it("accepts empty object", () => {
		const result = refreshBody.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({});
		}
	});

	it("accepts object with refreshToken string", () => {
		const result = refreshBody.safeParse({ refreshToken: "x" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.refreshToken).toBe("x");
		}
	});

	it("accepts object with refreshToken undefined", () => {
		const result = refreshBody.safeParse({ refreshToken: undefined });
		expect(result.success).toBe(true);
	});

	it("rejects non-string refreshToken", () => {
		const result = refreshBody.safeParse({ refreshToken: 123 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("refreshToken")),
			).toBe(true);
		}
	});

	it("rejects empty string refreshToken", () => {
		const result = refreshBody.safeParse({ refreshToken: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) => i.path.includes("refreshToken")),
			).toBe(true);
		}
	});
});
