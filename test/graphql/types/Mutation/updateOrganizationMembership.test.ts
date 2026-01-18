import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/schema";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteCurrentUser,
	Mutation_updateOrganizationMembership,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);

const [adminUser] = await server.drizzleClient
	.select({ id: usersTable.id })
	.from(usersTable)
	.where(
		eq(
			usersTable.emailAddress,
			server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
		),
	);

assertToBeNonNullish(adminUser);
const adminUserId = adminUser.id;

suite("Mutation field updateOrganizationMembership", () => {
	afterEach(async () => {
		vi.restoreAllMocks();
	});

	test("unauthenticated client", async () => {
		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						role: "administrator",
					},
				},
			},
		);

		expect(result.data?.updateOrganizationMembership).toBeNull();
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("authenticated but deleted user", async () => {
		const user = await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
			headers: { authorization: `bearer ${user.authToken}` },
		});

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${user.authToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("invalid arguments", async () => {
		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { memberId: "bad", organizationId: "bad" } },
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("member and organization both missing", async () => {
		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: faker.string.uuid(),
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("member missing only", async () => {
		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org A",
					description: "A",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: faker.string.uuid(),
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("organization missing only", async () => {
		const user = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: faker.string.uuid(),
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("membership does not exist", async () => {
		const user = await createRegularUserUsingAdmin();

		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org B",
					description: "B",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});

	test("non-admin cannot update membership", async () => {
		const userA = await createRegularUserUsingAdmin();
		const userB = await createRegularUserUsingAdmin();

		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org C",
					description: "C",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { memberId: userA.userId, organizationId: orgId } },
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { memberId: userB.userId, organizationId: orgId } },
		});

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${userA.authToken}` },
				variables: {
					input: {
						memberId: userB.userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe(
			"unauthorized_action_on_arguments_associated_resources",
		);
	});

	test("admin successfully updates role", async () => {
		const user = await createRegularUserUsingAdmin();

		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org D",
					description: "D",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId: orgId,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user.userId,
					organizationId: orgId,
				},
			},
		});

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();

		const [membership] = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, user.userId),
					eq(organizationMembershipsTable.organizationId, orgId),
				),
			);

		assertToBeNonNullish(membership);
		expect(membership.role).toBe("administrator");
	});

	test("admin successfully downgrades role from administrator to regular", async () => {
		const user = await createRegularUserUsingAdmin();

		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org Downgrade",
					description: "E",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId: orgId,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: { input: { memberId: user.userId, organizationId: orgId } },
		});

		await mercuriusClient.mutate(Mutation_updateOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user.userId,
					organizationId: orgId,
					role: "administrator",
				},
			},
		});

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
						role: "regular",
					},
				},
			},
		);

		expect(result.errors).toBeUndefined();

		const [membership] = await server.drizzleClient
			.select()
			.from(organizationMembershipsTable)
			.where(
				and(
					eq(organizationMembershipsTable.memberId, user.userId),
					eq(organizationMembershipsTable.organizationId, orgId),
				),
			);

		assertToBeNonNullish(membership);
		expect(membership.role).toBe("regular");
	});

	test("unexpected update failure", async () => {
		const user = await createRegularUserUsingAdmin();
		const org = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: "Org Unexpected",
					description: "Test",
					countryCode: "us",
					state: "CA",
					city: "LA",
					postalCode: "11111",
					addressLine1: "x",
					addressLine2: "y",
				},
			},
		});

		const orgId = org.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId: orgId,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					memberId: user.userId,
					organizationId: orgId,
				},
			},
		});

		const spy = vi
			.spyOn(server.drizzleClient, "update")
			.mockImplementationOnce(() => {
				return {
					set: () => ({
						where: () => ({
							returning: async () => [],
						}),
					}),
				} as unknown as ReturnType<typeof server.drizzleClient.update>;
			});

		const result = await mercuriusClient.mutate(
			Mutation_updateOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId: user.userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			},
		);

		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
		spy.mockRestore();
	});
});
