import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { graphql } from "gql.tada";
import type { GraphQLError } from "graphql";
import { afterEach, expect, suite, test, vi } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganizationMembership,
	Mutation_createUser,
} from "../documentNodes";

const Mutation_updateVenue = graphql(`
  mutation UpdateVenue($input: MutationUpdateVenueInput!) {
    updateVenue(input: $input) {
      id
      name
      description
      capacity
    }
  }
`);

const Mutation_createVenue = graphql(`
  mutation CreateVenue($input: MutationCreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      description
      capacity
    }
  }
`);

async function createOrgAndVenue() {
	const { accessToken: token } = await getAdminAuthViaRest(server);

	const orgRes = await mercuriusClient.mutate(
		graphql(`
      mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
        createOrganization(input: $input) { id }
      }
    `),
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					name: `TestOrg_${faker.string.ulid()}`,
					description: faker.lorem.sentence(),
				},
			},
		},
	);

	const orgId = orgRes.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);

	const venueRes = await mercuriusClient.mutate(Mutation_createVenue, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				organizationId: orgId,
				name: `Venue_${faker.string.ulid()}`,
				description: faker.lorem.sentence(),
				capacity: 50,
			},
		},
	});

	const venueId = venueRes.data?.createVenue?.id;
	assertToBeNonNullish(venueId);

	return {
		token,
		orgId,
		venueId,
		cleanup: async () => {
			await server.drizzleClient
				.delete(venuesTable)
				.where(eq(venuesTable.id, venueId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));
		},
	};
}

suite("Mutation field updateVenue", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();

		for (const fn of [...cleanupFns].reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		}

		cleanupFns.length = 0;
	});

	test("rejects unauthenticated user", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { venueId } = env;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			variables: {
				input: {
					id: venueId,
					name: "New Name",
				},
			},
		});

		expect(res.data?.updateVenue).toEqual(null);
		expect(res.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["updateVenue"],
				}),
			]),
		);
	});

	test("rejects invalid venue id format", async () => {
		const { accessToken } = await getAdminAuthViaRest(server);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${accessToken}`,
			},
			variables: {
				input: {
					id: "not-a-uuid",
					name: "Invalid",
				},
			},
		});

		expect(
			res.errors?.some(
				(e: GraphQLError) =>
					e.extensions?.code === "invalid_arguments" ||
					e.message.includes("got invalid value") ||
					e.message.includes("ID cannot represent") ||
					e.message.includes("Expected ID"),
			),
		).toBe(true);
	});

	test("rejects non-admin organization member", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { orgId, venueId, token: adminToken } = env;

		// Create a non-admin user (createUser + org membership + REST signin)
		const nonAdminUserEmail = `user_${faker.string.ulid()}@test.com`;
		const nonAdminUserPassword = faker.internet.password({ length: 16 });
		const createUserRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: nonAdminUserEmail,
					password: nonAdminUserPassword,
					name: `${faker.person.firstName()} ${faker.person.lastName()}`,
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const nonAdminUserId = createUserRes.data?.createUser?.user?.id;
		assertToBeNonNullish(nonAdminUserId);
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: nonAdminUserId,
					role: "regular",
				},
			},
		});
		const signInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: nonAdminUserEmail, password: nonAdminUserPassword },
		});
		expect(signInRes.statusCode).toBe(200);
		const nonAdminToken = signInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(nonAdminToken);

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, nonAdminUserId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Attempt to update venue with non-admin token
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: { authorization: `bearer ${nonAdminToken}` },
			variables: {
				input: {
					id: venueId,
					name: "Should Fail",
				},
			},
		});

		expect(res.errors?.length).toBeGreaterThan(0);
		expect(
			res.errors?.some(
				(e: GraphQLError) =>
					e.extensions?.code ===
					"unauthorized_action_on_arguments_associated_resources",
			),
		).toBe(true);
	});

	test("updates venue name only", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token } = env;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: env.orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: testVenueId,
					name: "Updated Venue Name",
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(testVenueId);
		expect(res.data?.updateVenue?.name).toBe("Updated Venue Name");
		expect(res.data?.updateVenue?.description).toBe("Initial description");
		expect(res.data?.updateVenue?.capacity).toBe(50);
	});

	test("updates capacity only", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token } = env;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: env.orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;
		const originalName = createVenueResult.data.createVenue.name;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: testVenueId,
					capacity: 200,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(testVenueId);
		expect(res.data?.updateVenue?.capacity).toBe(200);
		expect(res.data?.updateVenue?.description).toBe("Initial description");
		expect(res.data?.updateVenue?.name).toBe(originalName);
	});

	test("rejects when no optional fields are provided", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(res.errors?.length).toBeGreaterThan(0);
		expect(
			res.errors?.some(
				(e: GraphQLError) =>
					e.extensions?.code === "invalid_arguments" ||
					e.message.includes("At least one optional argument"),
			),
		).toBe(true);
	});

	test("rejects with non-existent but valid UUID venue id", async () => {
		const { accessToken } = await getAdminAuthViaRest(server);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${accessToken}`,
			},
			variables: {
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					name: "Nonexistent Venue",
				},
			},
		});

		expect(res.errors?.length).toBeGreaterThan(0);
		expect(
			res.errors?.some(
				(e: GraphQLError) =>
					e.extensions?.code === "arguments_associated_resources_not_found",
			),
		).toBe(true);
	});

	test("rejects duplicate venue name in same organization", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, orgId } = env;

		// Create first venue
		const createVenue1Result = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "First venue",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenue1Result.data?.createVenue?.id);
		const venue1Id = createVenue1Result.data.createVenue.id;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, venue1Id));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Create second venue with different name
		const createVenue2Result = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "Second venue",
						capacity: 100,
					},
				},
			},
		);

		assertToBeNonNullish(createVenue2Result.data?.createVenue?.id);
		const venue2Id = createVenue2Result.data.createVenue.id;
		const venue2Name = createVenue2Result.data.createVenue.name;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, venue2Id));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Try to rename venue1 to match venue2's name
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venue1Id,
					name: venue2Name,
				},
			},
		});

		expect(res.errors?.length).toBeGreaterThan(0);
		expect(
			res.errors?.some(
				(e: GraphQLError) =>
					e.extensions?.code ===
						"forbidden_action_on_arguments_associated_resources" &&
					(e.extensions?.issues as Array<{ message: string }>)?.[0]?.message ===
						"This name is not available.",
			),
		).toBe(true);
	});

	test("updates venue description only", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, orgId } = env;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 100,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;
		const originalName = createVenueResult.data.createVenue.name;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		const newDescription = "Updated description for testing";
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: testVenueId,
					description: newDescription,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(testVenueId);
		expect(res.data?.updateVenue?.description).toBe(newDescription);
		expect(res.data?.updateVenue?.name).toBe(originalName);
		expect(res.data?.updateVenue?.capacity).toBe(100);
	});

	test("updates multiple fields simultaneously", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, orgId } = env;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		const newName = "Multi Field Updated Venue";
		const newDescription = "Updated with multiple fields";
		const newCapacity = 500;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: testVenueId,
					name: newName,
					description: newDescription,
					capacity: newCapacity,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(testVenueId);
		expect(res.data?.updateVenue?.name).toBe(newName);
		expect(res.data?.updateVenue?.description).toBe(newDescription);
		expect(res.data?.updateVenue?.capacity).toBe(newCapacity);
	});

	test("successfully updates venue keeping the same name", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, orgId } = env;

		const venueName = `Conference Hall ${faker.string.ulid()}`;
		const initialCapacity = 100;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: venueName,
						description: faker.lorem.sentence(),
						capacity: initialCapacity,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Update the venue, keeping the same name but changing capacity
		const newCapacity = 200;
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: testVenueId,
					name: venueName, // Keep same name
					capacity: newCapacity, // Change capacity
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(testVenueId);
		expect(res.data?.updateVenue?.name).toBe(venueName);
		expect(res.data?.updateVenue?.capacity).toBe(newCapacity);
	});

	// FileMetadataInput attachment tests
	test("rejects attachment with invalid MIME type", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Try to update venue with invalid MIME type attachment using FileMetadataInput
		const updateVenueAttachments = graphql(`
			mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
				updateVenue(input: $input) {
					id
					attachments { mimeType }
				}
			}
		`);

		const result = await mercuriusClient.mutate(updateVenueAttachments, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: `attachments/${faker.string.uuid()}`,
							mimeType: "application/x-msdownload" as never,
							fileHash: faker.string.hexadecimal({
								length: 64,
								casing: "lower",
								prefix: "",
							}),
							name: "test.exe",
						},
					],
				},
			},
		});

		expect(result.data?.updateVenue).toBeUndefined();
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

	test("successfully updates venue with valid image attachment using FileMetadataInput", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Upload file to MinIO first (simulating presigned URL flow)
		const objectName = faker.string.ulid();
		const fileContent = Buffer.from("fake jpeg content");
		await server.minio.client.putObject(
			server.minio.bucketName,
			objectName,
			fileContent,
			fileContent.length,
			{ "content-type": "image/jpeg" },
		);

		cleanupFns.push(async () => {
			try {
				await server.minio.client.removeObject(
					server.minio.bucketName,
					objectName,
				);
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Update venue using FileMetadataInput
		const updateVenueAttachments = graphql(`
			mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
				updateVenue(input: $input) {
					id
					attachments { mimeType }
				}
			}
		`);

		const result = await mercuriusClient.mutate(updateVenueAttachments, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: objectName,
							mimeType: "IMAGE_JPEG",
							fileHash: faker.string.hexadecimal({
								length: 64,
								casing: "lower",
								prefix: "",
							}),
							name: "venue-photo.jpg",
						},
					],
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.updateVenue?.id);
	});

	test("returns invalid_arguments error when file not found in MinIO during update", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Mock statObject to throw NotFound error (file doesn't exist)
		const statObjectSpy = vi
			.spyOn(server.minio.client, "statObject")
			.mockRejectedValue(
				Object.assign(new Error("Not Found"), { code: "NotFound" }),
			);

		const updateVenueAttachments = graphql(`
			mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
				updateVenue(input: $input) {
					id
					attachments { mimeType }
				}
			}
		`);

		const result = await mercuriusClient.mutate(updateVenueAttachments, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: faker.string.ulid(),
							mimeType: "IMAGE_JPEG",
							fileHash: faker.string.hexadecimal({
								length: 64,
								casing: "lower",
								prefix: "",
							}),
							name: "venue-photo.jpg",
						},
					],
				},
			},
		});

		expect(result.data?.updateVenue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
		expect(statObjectSpy).toHaveBeenCalled();
		statObjectSpy.mockRestore();
	});

	test("returns unexpected error when MinIO statObject throws non-NotFound error", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Mock statObject to throw unexpected error (not NotFound)
		const statObjectSpy = vi
			.spyOn(server.minio.client, "statObject")
			.mockRejectedValue(new Error("Connection timeout"));

		const updateVenueAttachments = graphql(`
			mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
				updateVenue(input: $input) {
					id
					attachments { mimeType }
				}
			}
		`);

		const result = await mercuriusClient.mutate(updateVenueAttachments, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: faker.string.ulid(),
							mimeType: "IMAGE_JPEG",
							fileHash: faker.string.hexadecimal({
								length: 64,
								casing: "lower",
								prefix: "",
							}),
							name: "venue-photo.jpg",
						},
					],
				},
			},
		});

		expect(result.data?.updateVenue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unexpected",
					}),
				}),
			]),
		);
		expect(statObjectSpy).toHaveBeenCalled();
		statObjectSpy.mockRestore();
	});

	test("replaces existing attachments when updating with attachments", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Mock statObject to return success (file exists in MinIO)
		const statObjectSpy = vi
			.spyOn(server.minio.client, "statObject")
			.mockResolvedValue(
				{} as Awaited<ReturnType<typeof server.minio.client.statObject>>,
			);

		const objectName1 = `attachments/${faker.string.uuid()}`;
		const objectName2 = `attachments/${faker.string.uuid()}`;

		cleanupFns.push(async () => {
			try {
				await server.minio.client.removeObject(
					server.minio.bucketName,
					objectName1,
				);
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
			try {
				await server.minio.client.removeObject(
					server.minio.bucketName,
					objectName2,
				);
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		try {
			// Add initial attachment using FileMetadataInput
			const updateVenueWithInitialAttachment = graphql(`
				mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
					updateVenue(input: $input) {
						id
						attachments { mimeType }
					}
				}
			`);

			const initialAttachmentResult = await mercuriusClient.mutate(
				updateVenueWithInitialAttachment,
				{
					headers: {
						authorization: `bearer ${token}`,
					},
					variables: {
						input: {
							id: venueId,
							attachments: [
								{
									objectName: objectName1,
									mimeType: "IMAGE_JPEG",
									fileHash: faker.string.hexadecimal({
										length: 64,
										casing: "lower",
										prefix: "",
									}),
									name: "initial-photo.jpg",
								},
							],
						},
					},
				},
			);

			expect(initialAttachmentResult.errors).toBeUndefined();
			expect(
				initialAttachmentResult.data?.updateVenue?.attachments,
			).toHaveLength(1);

			// Update with a new attachment using FileMetadataInput
			const updateVenueAttachments = graphql(`
				mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
					updateVenue(input: $input) {
						id
						attachments { mimeType }
					}
				}
			`);

			const updateResult = await mercuriusClient.mutate(
				updateVenueAttachments,
				{
					headers: {
						authorization: `bearer ${token}`,
					},
					variables: {
						input: {
							id: venueId,
							attachments: [
								{
									objectName: objectName2,
									mimeType: "IMAGE_PNG",
									fileHash: faker.string.hexadecimal({
										length: 64,
										casing: "lower",
										prefix: "",
									}),
									name: "new-photo.png",
								},
							],
						},
					},
				},
			);

			expect(updateResult.errors).toBeUndefined();
			expect(updateResult.data?.updateVenue?.attachments).toHaveLength(1);
			expect(updateResult.data?.updateVenue?.attachments?.[0]?.mimeType).toBe(
				"image/png",
			);
		} finally {
			statObjectSpy.mockRestore();
		}
	});

	test("throws unauthenticated when current user no longer exists", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { orgId, venueId, token: adminToken } = env;

		// create temp user via createUser + org membership + REST signin
		const tempEmail = `temp-${faker.string.ulid()}@example.com`;
		const tempPassword = "Passw0rd!23";
		const createUserRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: tempEmail,
					password: tempPassword,
					name: "Temp User",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const tempUserId = createUserRes.data?.createUser?.user?.id;
		assertToBeNonNullish(tempUserId);
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: { organizationId: orgId, memberId: tempUserId, role: "regular" },
			},
		});
		const signInRes = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: tempEmail, password: tempPassword },
		});
		expect(signInRes.statusCode).toBe(200);
		const tempUserToken = signInRes.cookies.find(
			(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		)?.value;
		assertToBeNonNullish(tempUserToken);

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, tempUserId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// delete user from DB
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, tempUserId));

		// call mutation using now-invalid user token
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${tempUserToken}`,
			},
			variables: {
				input: {
					id: venueId,
					description: "New description",
				},
			},
		});

		expect(res.data?.updateVenue).toEqual(null);
		expect(res.errors).toBeDefined();
		expect(res.errors?.length).toBeGreaterThan(0);
		expect(res.errors?.[0]?.extensions.code).toBe("unauthenticated");
	});

	test("throws unexpected when update affects no rows", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, venueId } = env;

		// Use vi.spyOn for proper mock lifecycle management
		// Mock transaction to simulate update returning no rows
		const transactionSpy = vi
			.spyOn(server.drizzleClient, "transaction")
			.mockImplementation(async (handler) => {
				const fakeTx = {
					update: () => ({
						set: () => ({
							where: () => ({
								returning: async () => [undefined],
							}),
						}),
					}),
				};
				return handler(fakeTx as unknown as Parameters<typeof handler>[0]);
			});

		try {
			const res = await mercuriusClient.mutate(Mutation_updateVenue, {
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: { input: { id: venueId, description: "won't update" } },
			});

			expect(res.data?.updateVenue).toEqual(null);
			expect(res.errors).toBeDefined();
			expect(res.errors?.length).toBeGreaterThan(0);
			expect(res.errors?.[0]?.extensions.code).toBe("unexpected");
		} finally {
			// Restore mock explicitly (also handled by vi.restoreAllMocks in afterEach)
			transactionSpy.mockRestore();
		}
	});

	test("should succeed even when old attachment removal fails during update (lines 252-255)", async () => {
		const env = await createOrgAndVenue();
		cleanupFns.push(env.cleanup);

		const { token, orgId } = env;

		// Create venue WITHOUT attachments first
		const createVenueResult = await mercuriusClient.mutate(
			graphql(`
			  mutation CreateVenue($input: MutationCreateVenueInput!) {
				createVenue(input: $input) {
				  id
				}
			  }
			`),
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: faker.lorem.words(2),
						capacity: 100,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		const testVenueId = createVenueResult.data.createVenue.id;

		cleanupFns.push(async () => {
			try {
				await server.drizzleClient
					.delete(venuesTable)
					.where(eq(venuesTable.id, testVenueId));
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Put first file in MinIO
		const objectName1 = `attachments/${faker.string.uuid()}.jpg`;
		const fileContent = Buffer.from("fake image content");
		await server.minio.client.putObject(
			server.minio.bucketName,
			objectName1,
			fileContent,
			fileContent.length,
			{ "content-type": "image/jpeg" },
		);

		cleanupFns.push(async () => {
			try {
				await server.minio.client.removeObject(
					server.minio.bucketName,
					objectName1,
				);
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Add attachments via update
		const addAttachmentResult = await mercuriusClient.mutate(
			Mutation_updateVenue,
			{
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						id: testVenueId,
						attachments: [
							{
								objectName: objectName1,
								mimeType: "IMAGE_JPEG",
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "initial-photo.jpg",
							},
						],
					},
				},
			},
		);

		assertToBeNonNullish(addAttachmentResult.data?.updateVenue);

		// Put a new file in MinIO
		const objectName2 = `attachments/${faker.string.uuid()}.png`;
		await server.minio.client.putObject(
			server.minio.bucketName,
			objectName2,
			fileContent,
			fileContent.length,
			{ "content-type": "image/png" },
		);

		cleanupFns.push(async () => {
			try {
				await server.minio.client.removeObject(
					server.minio.bucketName,
					objectName2,
				);
			} catch (err) {
				console.error("Cleanup failed:", err);
			}
		});

		// Mock removeObject to fail (simulating cleanup failure)
		const removeObjectSpy = vi
			.spyOn(server.minio.client, "removeObject")
			.mockRejectedValue(new Error("Failed to delete object"));

		try {
			// Update venue with new attachments - this should succeed even if cleanup fails
			const updateResult = await mercuriusClient.mutate(Mutation_updateVenue, {
				headers: {
					authorization: `bearer ${token}`,
				},
				variables: {
					input: {
						id: testVenueId,
						attachments: [
							{
								objectName: objectName2,
								mimeType: "IMAGE_PNG",
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "new-photo.png",
							},
						],
					},
				},
			});

			// Key assertion: update succeeds even though removeObject failed
			expect(updateResult.errors).toBeUndefined();
			expect(updateResult.data?.updateVenue).toBeDefined();
		} finally {
			removeObjectSpy.mockRestore();
		}
	});
});
