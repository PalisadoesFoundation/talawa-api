import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import type { GraphQLError } from "graphql";
import { afterEach, expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
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

const Mutation_createOrganizationMembership = graphql(`
  mutation CreateOrganizationMembership(
    $input: MutationCreateOrganizationMembershipInput!
  ) {
    createOrganizationMembership(input: $input) {
      id
    }
  }
`);

suite("Mutation field updateVenue", () => {
	// TODO: Note: Attachment/MinIO upload paths not covered.
	// The implementation's attachment handling logic (file uploads, MinIO integration, rollback on failure) is not exercised by these tests.
	// The Upload scalar in mercuriusClient rejects mocked FileUpload objects with "Upload value invalid" before reaching resolver logic,
	// making it impractical to test file upload execution paths via GraphQL integration tests without HTTP multipart infrastructure.

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
		const nonAdminUserId = signUpResult.data.signUp.user.id;

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
});
