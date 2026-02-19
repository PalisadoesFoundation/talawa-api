import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { afterEach, expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_adminUpdateUserPassword } from "../documentNodes";

suite("Mutation field adminUpdateUserPassword", () => {
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

	const getAdminAuth = async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		return accessToken;
	};

	afterEach(async () => {
		vi.restoreAllMocks();
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("User cleanup failed:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("Returns unauthenticated when client is not authenticated", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				variables: {
					input: {
						id: user.userId,
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns unauthenticated when admin user no longer exists", async () => {
		const tempAdmin = await createRegularUserUsingAdmin();

		await server.drizzleClient
			.update(usersTable)
			.set({ role: "administrator" })
			.where(eq(usersTable.id, tempAdmin.userId));

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, tempAdmin.userId));

		const targetUser = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${tempAdmin.authToken}` },
				variables: {
					input: {
						id: targetUser.userId,
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			]),
		);
	});

	test("Returns forbidden_action when client is not admin", async () => {
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${user.authToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action",
					}),
				}),
			]),
		);
	});

	test("Returns forbidden_action when admin updates self", async () => {
		const adminToken = await getAdminAuth();

		const admin = await server.drizzleClient.query.usersTable.findFirst({
			where: (f, o) =>
				o.eq(
					f.emailAddress,
					server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				),
		});
		assertToBeNonNullish(admin);
		const adminId = admin.id;
		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: adminId,
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
					}),
				}),
			]),
		);
	});

	test("Returns not_found when target user does not exist", async () => {
		const adminToken = await getAdminAuth();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when passwords mismatch", async () => {
		const adminToken = await getAdminAuth();
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "newPassword123",
						confirmNewPassword: "differentPassword",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("Successfully updates user password by admin", async () => {
		const adminToken = await getAdminAuth();
		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "brandNewPassword123",
						confirmNewPassword: "brandNewPassword123",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.adminUpdateUserPassword).toBe(true);

		const updatedUser = await server.drizzleClient.query.usersTable.findFirst({
			where: (f, o) => o.eq(f.id, user.userId),
		});

		expect(updatedUser?.passwordHash).toBeDefined();
		expect(updatedUser?.failedLoginAttempts).toBe(0);
		expect(updatedUser?.lockedUntil).toBeNull();

		// Verify the user can sign in with the new password via REST
		const signInResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: {
				email: updatedUser?.emailAddress ?? "",
				password: "brandNewPassword123",
			},
		});
		expect(signInResponse.statusCode).toBe(200);
		expect(
			signInResponse.cookies.some(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN && c.value,
			),
		).toBe(true);
	});

	test("Admin can reset another admin password", async () => {
		const adminToken = await getAdminAuth();

		const targetAdmin = await createUserWithCleanup();

		// promote target to admin
		await server.drizzleClient
			.update(usersTable)
			.set({ role: "administrator" })
			.where(eq(usersTable.id, targetAdmin.userId));

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: targetAdmin.userId,
						newPassword: "newAdminPass123",
						confirmNewPassword: "newAdminPass123",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.adminUpdateUserPassword).toBe(true);
	});

	test("Admin can reset password multiple times", async () => {
		const adminToken = await getAdminAuth();
		const user = await createUserWithCleanup();

		const firstResult = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "firstPassword123",
						confirmNewPassword: "firstPassword123",
					},
				},
			},
		);
		expect(firstResult.errors).toBeUndefined();
		expect(firstResult.data?.adminUpdateUserPassword).toBe(true);

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "secondPassword123",
						confirmNewPassword: "secondPassword123",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.adminUpdateUserPassword).toBe(true);
	});

	test("Returns invalid_arguments when target user has no password login", async () => {
		const adminToken = await getAdminAuth();
		const user = await createUserWithCleanup();

		// remove password login
		await server.drizzleClient
			.update(usersTable)
			.set({ passwordHash: "" })
			.where(eq(usersTable.id, user.userId));

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when zod validation fails", async () => {
		const adminToken = await getAdminAuth();

		const user = await createUserWithCleanup();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "short", // < 8 chars
						confirmNewPassword: "short",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when id is invalid uuid", async () => {
		const adminToken = await getAdminAuth();

		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: "not-a-uuid",
						newPassword: "newPassword123",
						confirmNewPassword: "newPassword123",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("Returns invalid_arguments when new password equals current password", async () => {
		const adminToken = await getAdminAuth();
		const user = await createUserWithCleanup();

		// user original password = "password" (from helper)
		const result = await mercuriusClient.mutate(
			Mutation_adminUpdateUserPassword,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						id: user.userId,
						newPassword: "password",
						confirmNewPassword: "password",
					},
				},
			},
		);

		expect(result.data?.adminUpdateUserPassword ?? null).toEqual(null);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});
});
