import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { organizationMembershipsTable } from "src/drizzle/tables/organizationMemberships";
import { expect, suite, test } from "vitest";
import { usersTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
} from "../documentNodes";

const { accessToken: adminToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(adminToken);

suite("Mutation field createOrganizationMembership", () => {
	suite("authentication", () => {
		test("rejects unauthenticated client", async () => {
			const result = await mercuriusClient.mutate(
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

			expect(result.data?.createOrganizationMembership ?? null).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("rejects authenticated request if current user no longer exists in database", async () => {
			const user = await import("../createRegularUserUsingAdmin").then((m) =>
				m.createRegularUserUsingAdmin(),
			);

			// 2. Delete that user directly from the database
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, user.userId));

			// 3. Create an organization (by admin)
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Deleted User Org",
							description: "deleted user test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "Ghost",
							addressLine2: "User",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// 4. Call mutation with token of deleted user
			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${user.authToken}` },
					variables: {
						input: {
							memberId: user.userId,
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.data?.createOrganizationMembership ?? null).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});

	suite("validation errors", () => {
		test("rejects invalid arguments", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId: "not-a-uuid",
							organizationId: "not-a-uuid",
						},
					},
				},
			);

			expect(result.data?.createOrganizationMembership ?? null).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
		});
	});

	suite("associated resources not found", () => {
		test("member and organization both missing", async () => {
			const result = await mercuriusClient.mutate(
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

			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});

		test("member exists but organization missing", async () => {
			const { userId: memberId } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId,
							organizationId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});

		test("organization exists but member missing", async () => {
			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Org Exists Member Missing",
							description: "symmetric test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Symmetric",
							addressLine2: "Suite X",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
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

			expect(result.data?.createOrganizationMembership ?? null).toBeNull();
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});

	suite("authorization", () => {
		test("non-admin cannot add other existing users", async () => {
			const userA = await import("../createRegularUserUsingAdmin").then((m) =>
				m.createRegularUserUsingAdmin(),
			);

			const userB = await import("../createRegularUserUsingAdmin").then((m) =>
				m.createRegularUserUsingAdmin(),
			);

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Auth Org",
							description: "auth test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "123 Test",
							addressLine2: "Suite 1",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
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

			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_action_on_arguments_associated_resources",
			);
		});

		test("non-admin cannot assign role", async () => {
			const { authToken, userId } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Role Org",
							description: "role test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "456 Test",
							addressLine2: "Suite 2",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: userId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);

			expect(result.errors?.[0]?.extensions?.code).toBe(
				"unauthorized_arguments",
			);
		});
	});

	suite("success cases", () => {
		test("admin creates membership successfully", async () => {
			const { userId: memberId } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Success Org",
							description: "success",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "789 Test",
							addressLine2: "Suite 3",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId,
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createOrganizationMembership);
			expect(result.data.createOrganizationMembership.id).toBeTruthy();
		});

		test("non-admin can add themselves to organization", async () => {
			const user = await import("../createRegularUserUsingAdmin").then((m) =>
				m.createRegularUserUsingAdmin(),
			);

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Self Org",
							description: "self join",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "Self",
							addressLine2: "Suite",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${user.authToken}` },
					variables: {
						input: {
							memberId: user.userId,
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createOrganizationMembership);
		});

		test("admin can create membership with role argument", async () => {
			const { userId: memberId } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Admin Role Org",
							description: "admin role",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "101 Test",
							addressLine2: "Suite 4",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId,
							organizationId: orgId,
							role: "administrator",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createOrganizationMembership);
			const org = result.data?.createOrganizationMembership;
			expect(org?.id).toBe(orgId);

			// Verify role was stored correctly in DB
			const [membership] = await server.drizzleClient
				.select()
				.from(organizationMembershipsTable)
				.where(
					and(
						eq(organizationMembershipsTable.memberId, memberId),
						eq(organizationMembershipsTable.organizationId, orgId),
					),
				);

			assertToBeNonNullish(membership);
			expect(membership.role).toBe("administrator");
		});

		test("assigns default role of 'regular' when role not provided", async () => {
			const user = await import("../createRegularUserUsingAdmin").then((m) =>
				m.createRegularUserUsingAdmin(),
			);

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Default Role Org",
							description: "default role test",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "Role",
							addressLine2: "Test",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(
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

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.createOrganizationMembership);

			// Verify in DB
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

		test("prevents duplicate membership", async () => {
			const { userId: memberId } = await import(
				"../createRegularUserUsingAdmin"
			).then((m) => m.createRegularUserUsingAdmin());

			const createOrg = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Duplicate Org",
							description: "duplicate",
							countryCode: "us",
							state: "CA",
							city: "SF",
							postalCode: "94101",
							addressLine1: "111 Test",
							addressLine2: "Suite 5",
						},
					},
				},
			);

			const orgId = createOrg.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						memberId,
						organizationId: orgId,
					},
				},
			});

			const duplicate = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							memberId,
							organizationId: orgId,
						},
					},
				},
			);

			expect(duplicate.errors?.[0]?.extensions?.code).toBe(
				"forbidden_action_on_arguments_associated_resources",
			);
		});
	});
});
