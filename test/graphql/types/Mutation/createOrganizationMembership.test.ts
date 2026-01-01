import { faker } from "@faker-js/faker";
import { beforeAll, afterEach, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_deleteCurrentUser,
	Query_signIn,
} from "../documentNodes";

let adminToken: string;

beforeAll(async () => {
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress:
					server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password:
					server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(res.data?.signIn?.authenticationToken);
	adminToken = res.data.signIn.authenticationToken;
});

suite("Mutation field createOrganizationMembership", () => {
	const cleanup: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanup.reverse()) {
			try {
				await fn();
			} catch {}
		}
		cleanup.length = 0;
	});

	test("unauthenticated client", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
					},
				},
			},
		);

		expect(res.data?.createOrganizationMembership).toBeNull();
		expect(res.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["createOrganizationMembership"],
				}),
			]),
		);
	});

	test("invalid arguments (zod validation)", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: "not-a-uuid",
						organizationId: "also-not-a-uuid",
					},
				},
			},
		);

		expect(res.data?.createOrganizationMembership).toBeNull();
		expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		expect(res.errors?.[0]?.extensions?.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					argumentPath: expect.any(Array),
					message: expect.any(String),
				}),
			]),
		);
	});

	test("current user does not exist", async () => {
		const user = await createRegularUserUsingAdmin();

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user.userId } },
			});
		});

		await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
			headers: { authorization: `bearer ${user.authToken}` },
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${user.authToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
					},
				},
			},
		);

		expect(res.data?.createOrganizationMembership).toBeNull();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("member and organization both not found", async () => {
		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
					},
				},
			},
		);

		expect(res.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
		expect(res.errors?.[0]?.extensions?.issues).toHaveLength(2);
	});

	test("member not found", async () => {
		const orgRes = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Org-${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		const orgId = orgRes.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: orgId,
					},
				},
			},
		);

		const issues = res.errors?.[0]?.extensions?.issues as
			| Array<{ argumentPath: string[] }>
			| undefined;

		expect(issues?.[0]?.argumentPath).toEqual(["input", "memberId"]);
	});

	test("organization not found", async () => {
		const user = await createRegularUserUsingAdmin();

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user.userId } },
			});
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: faker.string.uuid(),
					},
				},
			},
		);

		const issues = res.errors?.[0]?.extensions?.issues as
			| Array<{ argumentPath: string[] }>
			| undefined;

		expect(issues?.[0]?.argumentPath).toEqual(["input", "organizationId"]);
	});

	test("membership already exists", async () => {
		const user = await createRegularUserUsingAdmin();

		const orgRes = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Org-${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		const orgId = orgRes.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user.userId } },
			});
		});

		await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
					},
				},
			},
		);

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
					},
				},
			},
		);

		expect(res.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});

	test("non-admin cannot add other users", async () => {
		const orgRes = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Org-${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		const orgId = orgRes.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const userA = await createRegularUserUsingAdmin();
		const userB = await createRegularUserUsingAdmin();

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userA.userId } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userB.userId } },
			});
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${userA.authToken}` },
				variables: {
					input: {
						memberId: userB.userId,
						organizationId: orgId,
					},
				},
			},
		);

		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("non-admin cannot provide role", async () => {
		const orgRes = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Org-${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		const orgId = orgRes.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const user = await createRegularUserUsingAdmin();

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user.userId } },
			});
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${user.authToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(res.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_arguments",
		);
	});

	test("admin successfully creates membership and returns organization", async () => {
		const user = await createRegularUserUsingAdmin();

		const orgRes = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Org-${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		const orgId = orgRes.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		cleanup.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: orgId } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: user.userId } },
			});
		});

		const res = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
					},
				},
			},
		);

		expect(res.errors).toBeUndefined();
		expect(res.data?.createOrganizationMembership?.id).toBe(orgId);
	});
});
