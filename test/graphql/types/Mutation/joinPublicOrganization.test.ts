import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";
import {
	organizationMembershipsTable,
	organizationsTable,
	usersTable,
} from "src/drizzle/schema";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";
import { assertToBeNonNullish } from "../../../helpers";

interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

const testCleanupFunctions: Array<() => Promise<void>> = [];

afterEach(async () => {
	for (const cleanup of testCleanupFunctions.reverse()) {
		try {
			await cleanup();
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	}
	testCleanupFunctions.length = 0;
});

async function createTestOrganization(): Promise<TestOrganization> {
	const adminAuthToken = "admin-token";

	const createOrgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${adminAuthToken}` },
		variables: { input: { name: `Org ${faker.string.uuid()}`, countryCode: "US" } },
	});

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);

	const orgId = createOrgResult.data.createOrganization.id;

	return {
		orgId,
		cleanup: async () => {
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				console.error("Failed to delete organization:", error);
			}
		},
	};
}

suite("Mutation joinPublicOrganization", () => {
	test("Fails when the user is unauthenticated", async () => {
		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const result = await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			variables: { input: { organizationId: organization.orgId } },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			])
		);
	});

	test("Fails when user is not found in database", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		const { authToken, userId } = regularUser;

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		await server.drizzleClient.delete(usersTable).where(eq(usersTable.id, userId)).execute();

		const result = await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { organizationId: organization.orgId } },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
				}),
			])
		);
	});

	test("Fails when the organization does not exist", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		const { authToken } = regularUser;

		const result = await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { organizationId: faker.string.uuid() } },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			])
		);
	});

	test("Fails when organization requires user registration", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		const { authToken } = regularUser;

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		await server.drizzleClient
			.update(organizationsTable)
			.set({ userRegistrationRequired: true })
			.where(eq(organizationsTable.id, organization.orgId))
			.execute();

		const result = await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { organizationId: organization.orgId } },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action",
					}),
				}),
			])
		);
	});

	test("Successfully joins the organization", async () => {
		const regularUser = await createRegularUserUsingAdmin();
		const { authToken } = regularUser;

		const organization = await createTestOrganization();
		testCleanupFunctions.push(organization.cleanup);

		const result = await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { organizationId: organization.orgId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data).toBeDefined();

		const membership = await server.drizzleClient.query.organizationMembershipsTable.findFirst({
			where: (fields, operators) =>
				operators.and(
					operators.eq(fields.memberId, regularUser.userId),
					operators.eq(fields.organizationId, organization.orgId)
				),
		});

		expect(membership).toBeDefined();
		expect(membership?.role).toEqual("regular");
	});
});
