import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";

import { usersTable } from "~/src/drizzle/tables/users";
import * as passwordChangeRateLimitModule from "~/src/utilities/passwordChangeRateLimit";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_updateUserPassword } from "../documentNodes";

suite("Mutation field updateUserPassword", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	const createUserWithCleanup = async () => {
		const user = await createRegularUserUsingAdmin();

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, user.userId));
			} catch (err) {
				console.error("User cleanup failed:", err);
			}
		});

		return user;
	};

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("Returns too_many_requests when rate limit exceeded", async () => {
		const user = await createUserWithCleanup();

		vi.spyOn(
			passwordChangeRateLimitModule,
			"checkPasswordChangeRateLimit",
		).mockReturnValue(false);

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "too_many_requests" }),
				}),
			]),
		);
	});

	test("Returns unauthenticated when client is not authenticated", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			variables: {
				input: {
					oldPassword: "anything",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns unauthenticated when token user no longer exists", async () => {
		const user = await createUserWithCleanup();

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, user.userId));

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when zod validation fails", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "",
					newPassword: "short",
					confirmNewPassword: "short",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when user has no passwordHash", async () => {
		const user = await createUserWithCleanup();

		await server.drizzleClient
			.update(usersTable)
			.set({ passwordHash: "" })
			.where(eq(usersTable.id, user.userId));

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when old password is incorrect", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "wrongPassword",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when new password equals old password", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "password",
					confirmNewPassword: "password",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when confirmation does not match", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "newPassword123",
					confirmNewPassword: "differentPassword",
				},
			},
		});

		expect(result.data?.updateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
				}),
			]),
		);
	});

	test("Successfully updates password", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "newPassword123",
					confirmNewPassword: "newPassword123",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateUserPassword).toBe(true);

		const updatedUser = await server.drizzleClient.query.usersTable.findFirst({
			where: (fields, ops) => ops.eq(fields.id, user.userId),
		});

		expect(updatedUser?.passwordHash).toBeDefined();
		expect(updatedUser?.failedLoginAttempts).toBe(0);
		expect(updatedUser?.lockedUntil).toBeNull();
	});

	test("Allows login with new password after update", async () => {
		const user = await createUserWithCleanup();

		await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "password",
					newPassword: "brandNewPassword123",
					confirmNewPassword: "brandNewPassword123",
				},
			},
		});

		const result = await mercuriusClient.mutate(Mutation_updateUserPassword, {
			headers: { authorization: `bearer ${user.authToken}` },
			variables: {
				input: {
					oldPassword: "brandNewPassword123",
					newPassword: "anotherPassword123",
					confirmNewPassword: "anotherPassword123",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateUserPassword).toBe(true);
	});
});
