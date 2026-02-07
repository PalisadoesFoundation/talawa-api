import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { graphql } from "gql.tada";
import type { GraphQLError } from "graphql";
import { afterEach, expect, suite, test, vi } from "vitest";
import { usersTable } from "~/src/drizzle/tables/users";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

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

const Query_signIn = graphql(`
  query SignIn($input: QuerySignInInput!) {
    signIn(input: $input) {
      authenticationToken
      user {
        id
      }
    }
  }
`);

const Mutation_signUp = graphql(`
  mutation SignUp($input: MutationSignUpInput!) {
    signUp(input: $input) {
      authenticationToken
      user {
        id
      }
    }
  }
`);

suite("Mutation field updateVenue", () => {
	// Attachment/MinIO upload paths are covered via Fastify raw multipart injection tests below (see createVenue tests for reference).
	// We use server.inject with multipart form-data payloads to exercise the Upload scalar and MinIO interactions.
	const createdResources: {
		venueIds: string[];
	} = {
		venueIds: [],
	};

	afterEach(async () => {
		// Cleanup: Delete created venues
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
		if (adminToken) {
			for (const venueId of createdResources.venueIds) {
				try {
					await mercuriusClient.mutate(
						graphql(`
              mutation DeleteVenue($input: MutationDeleteVenueInput!) {
                deleteVenue(input: $input) {
                  id
                }
              }
            `),
						{
							headers: { authorization: `bearer ${adminToken}` },
							variables: { input: { id: venueId } },
						},
					);
				} catch (_error) {
					// Venue might already be deleted
				}
			}
		}
		createdResources.venueIds = [];
	});

	test("rejects unauthenticated user", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			variables: {
				input: {
					id: createVenueResult.data.createVenue.id,
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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
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
		// Sign in as admin
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data?.signIn?.authenticationToken);
		const adminToken = adminSignInResult.data.signIn.authenticationToken;

		// Create organization as admin
		const createOrgResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
		const orgId = createOrgResult.data.createOrganization.id;

		// Create venue as admin
		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		// Create a non-admin user
		const nonAdminUserEmail = `user_${faker.string.ulid()}@test.com`;
		const nonAdminUserPassword = faker.internet.password({ length: 16 });
		const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: nonAdminUserEmail,
					name: `${faker.person.firstName()} ${faker.person.lastName()}`,
					password: nonAdminUserPassword,
					selectedOrganization: orgId,
				},
			},
		});

		assertToBeNonNullish(signUpResult.data?.signUp?.authenticationToken);
		assertToBeNonNullish(signUpResult.data?.signUp?.user?.id);
		const nonAdminToken = signUpResult.data.signUp.authenticationToken;

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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					name: "Updated Venue Name",
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(venueId);
		expect(res.data?.updateVenue?.name).toBe("Updated Venue Name");
		expect(res.data?.updateVenue?.description).toBe("Initial description");
		expect(res.data?.updateVenue?.capacity).toBe(50);
	});

	test("updates capacity only", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;
		const originalName = createVenueResult.data.createVenue.name;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					capacity: 200,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(venueId);
		expect(res.data?.updateVenue?.capacity).toBe(200);
		expect(res.data?.updateVenue?.description).toBe("Initial description");
		expect(res.data?.updateVenue?.name).toBe(originalName);
	});

	test("rejects when no optional fields are provided", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: createVenueResult.data.createVenue.id,
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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		// Create first venue
		const createVenue1Result = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "First venue",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenue1Result.data?.createVenue?.id);
		createdResources.venueIds.push(createVenue1Result.data.createVenue.id);
		const venue1Id = createVenue1Result.data.createVenue.id;

		// Create second venue with different name
		const createVenue2Result = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "Second venue",
						capacity: 100,
					},
				},
			},
		);

		assertToBeNonNullish(createVenue2Result.data?.createVenue?.id);
		createdResources.venueIds.push(createVenue2Result.data.createVenue.id);
		const venue2Name = createVenue2Result.data.createVenue.name;

		// Try to rename venue1 to match venue2's name
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 100,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;
		const originalName = createVenueResult.data.createVenue.name;

		const newDescription = "Updated description for testing";
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					description: newDescription,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(venueId);
		expect(res.data?.updateVenue?.description).toBe(newDescription);
		expect(res.data?.updateVenue?.name).toBe(originalName);
		expect(res.data?.updateVenue?.capacity).toBe(100);
	});

	test("updates multiple fields simultaneously", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
        mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
          createOrganization(input: $input) {
            id
          }
        }
      `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: createOrganizationResult.data.createOrganization.id,
						name: `Venue_${faker.string.ulid()}`,
						description: "Initial description",
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		const newName = "Multi Field Updated Venue";
		const newDescription = "Updated with multiple fields";
		const newCapacity = 500;

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					name: newName,
					description: newDescription,
					capacity: newCapacity,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(venueId);
		expect(res.data?.updateVenue?.name).toBe(newName);
		expect(res.data?.updateVenue?.description).toBe(newDescription);
		expect(res.data?.updateVenue?.capacity).toBe(newCapacity);
	});

	test("successfully updates venue keeping the same name", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
          mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const venueName = `Conference Hall ${faker.string.ulid()}`;
		const initialCapacity = 100;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
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
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		// Update the venue, keeping the same name but changing capacity
		const newCapacity = 200;
		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					name: venueName, // Keep same name
					capacity: newCapacity, // Change capacity
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data?.updateVenue?.id).toBe(venueId);
		expect(res.data?.updateVenue?.name).toBe(venueName);
		expect(res.data?.updateVenue?.capacity).toBe(newCapacity);
	});

	// FileMetadataInput attachment tests
	test("rejects attachment with invalid MIME type", async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
          mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

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
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: faker.string.ulid(),
							mimeType: "application/x-msdownload" as never,
							fileHash: faker.string.alphanumeric(64),
							name: "test.exe",
						},
					],
				},
			},
		});

		expect(result.data?.updateVenue).toEqual(null);
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
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
          mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 50,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

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
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: venueId,
					attachments: [
						{
							objectName: objectName,
							mimeType: "image/jpeg",
							fileHash: faker.string.alphanumeric(64),
							name: "venue-photo.jpg",
						},
					],
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.updateVenue?.id);

		// Cleanup: remove uploaded file
		await server.minio.client.removeObject(server.minio.bucketName, objectName);
	});

	test("returns unexpected error when MinIO upload fails during update", async () => {
		const originalPutObject = server.minio.client.putObject;
		const originalRemoveObject = server.minio.client.removeObject;

		const removeObjectSpy = vi.fn().mockResolvedValue(undefined);

		try {
			const administratorUserSignInResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				},
			);

			assertToBeNonNullish(
				administratorUserSignInResult.data?.signIn?.authenticationToken,
			);

			const createOrganizationResult = await mercuriusClient.mutate(
				graphql(`
          mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
            createOrganization(input: $input) {
              id
            }
          }
        `),
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							name: `TestOrg_${faker.string.ulid()}`,
							description: faker.lorem.sentence(),
						},
					},
				},
			);

			assertToBeNonNullish(
				createOrganizationResult.data?.createOrganization?.id,
			);
			const orgId = createOrganizationResult.data.createOrganization.id;

			const createVenueResult = await mercuriusClient.mutate(
				Mutation_createVenue,
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							organizationId: orgId,
							name: `Venue_${faker.string.ulid()}`,
							description: faker.lorem.sentence(),
							capacity: 50,
						},
					},
				},
			);

			assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
			createdResources.venueIds.push(createVenueResult.data.createVenue.id);
			const venueId = createVenueResult.data.createVenue.id;

			// mock MinIO: first put succeeds, second rejects
			let callCount = 0;
			server.minio.client.putObject = vi.fn().mockImplementation(async () => {
				callCount += 1;
				if (callCount === 2) {
					throw new Error("simulated failure");
				}
				return {};
			});

			server.minio.client.removeObject = removeObjectSpy;

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `
					mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
						updateVenue(input: $input) {
							id
						}
					}
				`,
				variables: {
					input: {
						id: venueId,
						attachments: [null, null],
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.attachments.0"],
				"1": ["variables.input.attachments.1"],
			});

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="photo1.jpg"',
				"Content-Type: image/jpeg",
				"",
				"img1",
				`--${boundary}`,
				'Content-Disposition: form-data; name="1"; filename="photo2.jpg"',
				"Content-Type: image/jpeg",
				"",
				"img2",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.data?.updateVenue).toEqual(null);
			expect(result.errors[0].extensions.code).toBe("unexpected");
			expect(removeObjectSpy).toHaveBeenCalled();
		} finally {
			server.minio.client.putObject = originalPutObject;
			server.minio.client.removeObject = originalRemoveObject;
		}
	});

	test("propagates TalawaGraphQLError when MinIO throws TalawaGraphQLError during upload", async () => {
		const originalPutObject = server.minio.client.putObject;
		try {
			const administratorUserSignInResult = await mercuriusClient.query(
				Query_signIn,
				{
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				},
			);

			assertToBeNonNullish(
				administratorUserSignInResult.data?.signIn?.authenticationToken,
			);

			const createOrganizationResult = await mercuriusClient.mutate(
				graphql(`
				  mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
					createOrganization(input: $input) {
					  id
					}
				  }
				`),
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							name: `TestOrg_${faker.string.ulid()}`,
							description: faker.lorem.sentence(),
						},
					},
				},
			);

			assertToBeNonNullish(
				createOrganizationResult.data?.createOrganization?.id,
			);
			const orgId = createOrganizationResult.data.createOrganization.id;

			const createVenueResult = await mercuriusClient.mutate(
				Mutation_createVenue,
				{
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							organizationId: orgId,
							name: `Venue_${faker.string.ulid()}`,
							description: faker.lorem.sentence(),
							capacity: 50,
						},
					},
				},
			);

			assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
			createdResources.venueIds.push(createVenueResult.data.createVenue.id);
			const venueId = createVenueResult.data.createVenue.id;

			// mock MinIO to throw TalawaGraphQLError
			server.minio.client.putObject = vi.fn().mockImplementation(async () => {
				throw new TalawaGraphQLError({
					message: "minio failure",
					extensions: { code: "unexpected" },
				});
			});

			const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
			const operations = JSON.stringify({
				query: `
					mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
						updateVenue(input: $input) {
							id
						}
					}
				`,
				variables: {
					input: {
						id: venueId,
						attachments: [null],
					},
				},
			});

			const map = JSON.stringify({
				"0": ["variables.input.attachments.0"],
			});

			const body = [
				`--${boundary}`,
				'Content-Disposition: form-data; name="operations"',
				"",
				operations,
				`--${boundary}`,
				'Content-Disposition: form-data; name="map"',
				"",
				map,
				`--${boundary}`,
				'Content-Disposition: form-data; name="0"; filename="photo1.jpg"',
				"Content-Type: image/jpeg",
				"",
				"img1",
				`--${boundary}--`,
			].join("\r\n");

			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": `multipart/form-data; boundary=${boundary}`,
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				payload: body,
			});

			const result = JSON.parse(response.body);

			expect(result.data?.updateVenue).toEqual(null);
			expect(result.errors[0].extensions.code).toBe("unexpected");
		} finally {
			server.minio.client.putObject = originalPutObject;
		}
	});

	test("replaces existing attachments when updating with attachments", async () => {
		// Create venue with initial attachment
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		// create organization for venue
		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
			  mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
				createOrganization(input: $input) {
				  id
				}
			  }
			`),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const boundaryCreate = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operationsCreate = JSON.stringify({
			query: `
				mutation CreateVenue($input: MutationCreateVenueInput!) {
					createVenue(input: $input) {
						id
						attachments { mimeType }
					}
				}
			`,
			variables: {
				input: {
					organizationId: orgId,
					name: `Venue_${faker.string.ulid()}`,
					description: faker.lorem.sentence(),
					capacity: 10,
					attachments: [null],
				},
			},
		});

		const mapCreate = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});
		const bodyCreate = [
			`--${boundaryCreate}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operationsCreate,
			`--${boundaryCreate}`,
			'Content-Disposition: form-data; name="map"',
			"",
			mapCreate,
			`--${boundaryCreate}`,
			'Content-Disposition: form-data; name="0"; filename="photo1.jpg"',
			"Content-Type: image/jpeg",
			"",
			"img1",
			`--${boundaryCreate}--`,
		].join("\r\n");

		const responseCreate = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundaryCreate}`,
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			payload: bodyCreate,
		});

		const createResult = JSON.parse(responseCreate.body);
		assertToBeNonNullish(createResult.data?.createVenue?.id);
		createdResources.venueIds.push(createResult.data.createVenue.id);
		const venueId = createResult.data.createVenue.id;
		expect(createResult.data.createVenue.attachments).toHaveLength(1);

		// Update with a new attachment and assert only the new one remains
		const boundaryUpdate = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operationsUpdate = JSON.stringify({
			query: `
				mutation Mutation_updateVenue($input: MutationUpdateVenueInput!) {
					updateVenue(input: $input) {
						id
						attachments { mimeType }
					}
				}
			`,
			variables: {
				input: {
					id: venueId,
					attachments: [null],
				},
			},
		});

		const mapUpdate = JSON.stringify({
			"0": ["variables.input.attachments.0"],
		});
		const bodyUpdate = [
			`--${boundaryUpdate}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operationsUpdate,
			`--${boundaryUpdate}`,
			'Content-Disposition: form-data; name="map"',
			"",
			mapUpdate,
			`--${boundaryUpdate}`,
			'Content-Disposition: form-data; name="0"; filename="photo2.jpg"',
			"Content-Type: image/png",
			"",
			"img2",
			`--${boundaryUpdate}--`,
		].join("\r\n");

		const responseUpdate = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundaryUpdate}`,
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			payload: bodyUpdate,
		});

		const updateResult = JSON.parse(responseUpdate.body);
		expect(updateResult.errors).toBeUndefined();
		expect(updateResult.data?.updateVenue?.attachments).toHaveLength(1);
		expect(updateResult.data?.updateVenue?.attachments[0].mimeType).toBe(
			"image/png",
		);
	});

	test("throws unauthenticated when current user no longer exists", async () => {
		// Create organization and venue as admin
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
			  mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
				createOrganization(input: $input) {
				  id
				}
			  }
			`),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 10,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		// Create a temporary user and sign in
		const tempEmail = `temp-${faker.string.ulid()}@example.com`;
		const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
			variables: {
				input: {
					emailAddress: tempEmail,
					password: "Passw0rd!23",
					name: "Temp User",
					selectedOrganization: orgId,
				},
			},
		});

		assertToBeNonNullish(signUpResult.data?.signUp?.authenticationToken);
		const tempSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: { emailAddress: tempEmail, password: "Passw0rd!23" },
			},
		});
		assertToBeNonNullish(tempSignIn.data?.signIn?.authenticationToken);

		// Remove user record from DB so lookup returns undefined
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.emailAddress, tempEmail));

		const res = await mercuriusClient.mutate(Mutation_updateVenue, {
			headers: {
				authorization: `bearer ${tempSignIn.data.signIn.authenticationToken}`,
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
		if (!res.errors) {
			throw new Error("Errors not found");
		}
		expect(res.errors.length).toBeGreaterThan(0);
		expect(res.errors?.[0]?.extensions.code).toBe("unauthenticated");
	});

	test("throws unexpected when update affects no rows", async () => {
		// create org + venue
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data?.signIn?.authenticationToken,
		);

		const createOrganizationResult = await mercuriusClient.mutate(
			graphql(`
			  mutation CreateOrganization($input: MutationCreateOrganizationInput!) {
				createOrganization(input: $input) { id }
			  }
			`),
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		assertToBeNonNullish(createOrganizationResult.data?.createOrganization?.id);
		const orgId = createOrganizationResult.data.createOrganization.id;

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Venue_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
						capacity: 10,
					},
				},
			},
		);

		assertToBeNonNullish(createVenueResult.data?.createVenue?.id);
		createdResources.venueIds.push(createVenueResult.data.createVenue.id);
		const venueId = createVenueResult.data.createVenue.id;

		// Mock transaction to simulate update returning no rows
		const originalTransaction = server.drizzleClient.transaction;
		server.drizzleClient.transaction = vi
			.fn()
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
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
				variables: { input: { id: venueId, description: "won't update" } },
			});

			expect(res.data?.updateVenue).toEqual(null);
			expect(res.errors).toBeDefined();
			expect(res.errors?.length).toBeGreaterThan(0);
			expect(res.errors?.[0]?.extensions.code).toBe("unexpected");
		} finally {
			server.drizzleClient.transaction = originalTransaction;
		}
	});
});
