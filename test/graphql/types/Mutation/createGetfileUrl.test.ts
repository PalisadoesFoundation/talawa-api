import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createGetfileUrl,
	Mutation_createOrganization,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field createGetfileUrl", () => {
	// 1. Unauthenticated: should throw unauthenticated error.
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				variables: {
					input: {
						objectName: "uploads/sample.txt",
						organizationId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createGetfileUrl"],
					}),
				]),
			);
		});
	});

	// 2. Organization not found: should throw arguments_associated_resources_not_found.
	suite("when the specified organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			// Use a random organizationId.
			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						objectName: "uploads/sample.txt",
						organizationId: faker.string.uuid(),
					},
				},
			});
			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createGetfileUrl"],
					}),
				]),
			);
		});
	});

	// 3. Missing objectName: should throw invalid_arguments.
	suite("when objectName is missing", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "getfileurl-org",
							description: "Organization for getfileUrl test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Market St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Call the mutation without objectName.
			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						objectName: "", // empty string should trigger invalid_arguments
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "objectName"],
									message: expect.any(String),
								}),
							]),
						}),
						path: ["createGetfileUrl"],
					}),
				]),
			);
		});
	});

	// 4. Successful generation: returns a presigned URL.
	suite("when presigned URL is generated successfully", () => {
		test("should return a presignedUrl", async () => {
			// Override the minio client's presignedGetObject to simulate success.
			const originalPresignedGetObject = server.minio.client.presignedGetObject;
			server.minio.client.presignedGetObject = async (
				_bucket: string,
				_objectName: string,
				_expiry: number,
			): Promise<string> => {
				return "https://example.com/get-presigned-url";
			};
			// Create an organization.
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "getfileurl-org-success",
							description: "Organization for getfileUrl success test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Market St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const testObjectName = "uploads/sample.txt";

			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						objectName: testObjectName,
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createGetfileUrl).toEqual(
				expect.objectContaining({
					presignedUrl: "https://example.com/get-presigned-url",
				}),
			);

			// Restore original presignedGetObject.
			server.minio.client.presignedGetObject = originalPresignedGetObject;
		});
	});

	// 5. When presignedGetObject fails with an Error.
	suite("when presignedGetObject fails with an Error", () => {
		test("should return an error with unexpected extensions code and proper message", async () => {
			const originalPresignedGetObject = server.minio.client.presignedGetObject;
			server.minio.client.presignedGetObject = async (): Promise<string> => {
				throw new Error("Simulated get error");
			};

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "getfileurl-org-error",
							description: "Org for getfileUrl error test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Market St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						objectName: "uploads/sample.txt",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
							message: expect.stringContaining(
								"Error generating presigned URL: Simulated get error",
							),
						}),
						path: ["createGetfileUrl"],
					}),
				]),
			);

			server.minio.client.presignedGetObject = originalPresignedGetObject;
		});
	});
	suite("when the current user does not exist in the database", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			// Create a new user using admin privileges.
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `user${faker.string.ulid()}@example.com`,
							isEmailAddressVerified: false,
							name: "Test User",
							password: "password",
							role: "regular",
						},
					},
				},
			);
			assertToBeNonNullish(createUserResult.data?.createUser);
			const userToken = createUserResult.data.createUser.authenticationToken;
			assertToBeNonNullish(userToken);

			// Delete the created user so that subsequent lookups return undefined.
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			// Create a valid organization using admin token.
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "GetfileUrl Org",
							description: "Org for createGetfileUrl test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Attempt to call createGetfileUrl with the deleted user's token.
			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						objectName: "uploads/sample.txt",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createGetfileUrl"],
					}),
				]),
			);
		});
	});

	// 6. When presignedGetObject fails with a non-Error.
	suite("when presignedGetObject fails with a non-Error rejection", () => {
		test("should return an error with unexpected extensions code and 'An unknown error occurred' message", async () => {
			const originalPresignedGetObject = server.minio.client.presignedGetObject;
			server.minio.client.presignedGetObject = async (): Promise<string> => {
				return Promise.reject("Simulated unknown error");
			};
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "getfileurl-org-unknown",
							description: "Org for unknown error test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Market St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_createGetfileUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						objectName: "uploads/sample.txt",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createGetfileUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
							message: "An unknown error occurred",
						}),
						path: ["createGetfileUrl"],
					}),
				]),
			);

			server.minio.client.presignedGetObject = originalPresignedGetObject;
		});
	});
});
