import { describe, expect, it } from "vitest";
import { assertOrganizationAdmin } from "../../src/utilities/authorization";
import { TalawaGraphQLError } from "../../src/utilities/TalawaGraphQLError";

describe("assertOrganizationAdmin", () => {
	const errorMessage = "You are not authorized to perform this action";

	it("should not throw error when currentUser role is administrator", () => {
		const currentUser = { role: "administrator" };
		const membership = { role: "member" };

		expect(() =>
			assertOrganizationAdmin(currentUser, membership, errorMessage),
		).not.toThrow();
	});

	it("should not throw error when membership role is administrator", () => {
		const currentUser = { role: "user" };
		const membership = { role: "administrator" };

		expect(() =>
			assertOrganizationAdmin(currentUser, membership, errorMessage),
		).not.toThrow();
	});

	it("should not throw error when bothCurrentUser and membership roles are administrator", () => {
		const currentUser = { role: "administrator" };
		const membership = { role: "administrator" };

		expect(() =>
			assertOrganizationAdmin(currentUser, membership, errorMessage),
		).not.toThrow();
	});

	it("should throw TalawaGraphQLError when neither currentUser nor membership role is administrator", () => {
		const currentUser = { role: "user" };
		const membership = { role: "member" };

		let caught: unknown;
		try {
			assertOrganizationAdmin(currentUser, membership, errorMessage);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(TalawaGraphQLError);
		const gqlError = caught as TalawaGraphQLError;
		expect(gqlError.extensions.code).toBe("unauthorized_action");
		expect(gqlError.message).toBe(errorMessage);
	});

	it("should throw TalawaGraphQLError when currentUser is undefined", () => {
		const currentUser = undefined;
		const membership = { role: "member" };

		let caught: unknown;
		try {
			assertOrganizationAdmin(currentUser, membership, errorMessage);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(TalawaGraphQLError);
		const gqlError = caught as TalawaGraphQLError;
		expect(gqlError.extensions.code).toBe("unauthorized_action");
		expect(gqlError.message).toBe(errorMessage);
	});

	it("should throw TalawaGraphQLError when membership is undefined", () => {
		const currentUser = { role: "user" };
		const membership = undefined;

		let caught: unknown;
		try {
			assertOrganizationAdmin(currentUser, membership, errorMessage);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(TalawaGraphQLError);
		const gqlError = caught as TalawaGraphQLError;
		expect(gqlError.extensions.code).toBe("unauthorized_action");
		expect(gqlError.message).toBe(errorMessage);
	});

	it("should throw TalawaGraphQLError when both currentUser and membership are undefined", () => {
		const currentUser = undefined;
		const membership = undefined;

		let caught: unknown;
		try {
			assertOrganizationAdmin(currentUser, membership, errorMessage);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(TalawaGraphQLError);
		const gqlError = caught as TalawaGraphQLError;
		expect(gqlError.extensions.code).toBe("unauthorized_action");
		expect(gqlError.message).toBe(errorMessage);
	});

	it("should throw TalawaGraphQLError when roles are null", () => {
		const currentUser = { role: null };
		const membership = { role: null };

		let caught: unknown;
		try {
			assertOrganizationAdmin(currentUser, membership, errorMessage);
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(TalawaGraphQLError);
		const gqlError = caught as TalawaGraphQLError;
		expect(gqlError.extensions.code).toBe("unauthorized_action");
		expect(gqlError.message).toBe(errorMessage);
	});
});
