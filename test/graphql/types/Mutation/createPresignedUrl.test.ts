import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createOrganization,
	Mutation_createPresignedUrl,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field createPresignedUrl", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: faker.string.uuid(),
						fileHash: "test-hash",
					},
				},
			});
			expect(result.data?.createPresignedUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createPresignedUrl"],
					}),
				]),
			);
		});
	});

	suite("when the presigned URL is generated successfully", () => {
		test("should return a presignedUrl and objectName", async () => {
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (
				bucket: string,
				objectName: string,
				_expiry: number,
			): Promise<string> => {
				const fallbackBaseUrl = `http://${server.envConfig.API_MINIO_END_POINT}:${server.envConfig.API_MINIO_PORT}`;
				const effectiveBaseUrl =
					server.envConfig.API_MINIO_PUBLIC_BASE_URL || fallbackBaseUrl;
				return `${effectiveBaseUrl}/${bucket}/${objectName}`;
			};
			const { accessToken: authToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(authToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "presigned-url-org",
							description: "Organization for presigned URL test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
							isUserRegistrationRequired: false,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: orgId,
						fileHash: "test-hash-sha-256",
					},
				},
			});
			const presignedUrl = result.data?.createPresignedUrl?.presignedUrl;
			const fallbackBaseUrl = `http://${server.envConfig.API_MINIO_END_POINT}:${server.envConfig.API_MINIO_PORT}`;
			const baseUrl =
				server.envConfig.API_MINIO_PUBLIC_BASE_URL || fallbackBaseUrl;
			if (!server.envConfig.API_MINIO_PUBLIC_BASE_URL) {
				console.warn(
					"API_MINIO_PUBLIC_BASE_URL missing; using fallback:",
					fallbackBaseUrl,
				);
			}
			expect(typeof presignedUrl).toBe("string");
			if (typeof presignedUrl === "string") {
				expect(presignedUrl.startsWith(baseUrl)).toBe(true);
			}

			expect(result.data?.createPresignedUrl?.requiresUpload).toBe(true);

			assertToBeNonNullish(result.data?.createPresignedUrl);
			expect(result.data.createPresignedUrl.objectName).toMatch(
				/^uploads\/[0-9a-f-]+\/\d+-test-hash-sha-256-testfile\.txt$/i,
			);
			server.minio.client.presignedPutObject = originalPresignedPutObject;
		});
	});

	suite("when the organizationId is invalid", () => {
		test("should return a error with resources_not_found extension code ", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: faker.string.uuid(),
						fileHash: "test-hash-3",
					},
				},
			});

			console.log(result);
			expect(result.data?.createPresignedUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createPresignedUrl"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			// Step 2: Create a new user using admin privileges.
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							emailAddress: `testuser${faker.string.ulid()}@example.com`,
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

			// Step 3: Delete the created user so that they no longer exist.
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			// Step 4: Create an organization (using admin token) to supply a valid organizationId.
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Test Org",
							description: "Test organization for presigned URL",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
							isUserRegistrationRequired: false,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(createOrgResult.data?.createOrganization);
			assertToBeNonNullish(orgId);

			// Step 5: Use the deleted user's token to call createPresignedUrl.
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: orgId,
						fileHash: "test-hash-4",
					},
				},
			});

			// Step 6: Assert that the mutation returns an error with code "unauthenticated".
			expect(result.data?.createPresignedUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createPresignedUrl"],
					}),
				]),
			);
		});
	});

	suite("when presignedPutObject fails with a non-Error rejection", () => {
		test("should return an error with unexpected extensions code and 'An unknown error occurred' message", async () => {
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (): Promise<string> => {
				return Promise.reject("Simulated unknown error");
			};
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "presigned-url-org-unknown-error",
							description: "Organization for unknown error test",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: false,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: orgId,
						fileHash: "test-hash-5",
					},
				},
			});

			server.minio.client.presignedPutObject = originalPresignedPutObject;

			expect(result.data?.createPresignedUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
							message: "An unknown error occurred",
						}),
						path: ["createPresignedUrl"],
					}),
				]),
			);
		});
	});
	suite("when the file already exists in postAttachmentsTable", () => {
		test("should return the existing file details without generating a presigned URL", async () => {
			const { accessToken: authToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(authToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Existing File Org",
							description: "Organization for testing existing file branch",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "500 Test Blvd",
							addressLine2: "Suite 50",
							isUserRegistrationRequired: false,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			const originalFindFirst =
				server.drizzleClient.query.postAttachmentsTable.findFirst;
			server.drizzleClient.query.postAttachmentsTable.findFirst = vi
				.fn()
				.mockResolvedValue({
					objectName: "existing-object-name",
					fileHash: "test-file-hash",
				});
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: orgId,
						fileHash: "test-file-hash",
						objectName: "",
					},
				},
			});
			server.drizzleClient.query.postAttachmentsTable.findFirst =
				originalFindFirst;

			expect(result.data?.createPresignedUrl).toEqual(
				expect.objectContaining({
					presignedUrl: null,
					objectName: "existing-object-name",
					requiresUpload: false,
				}),
			);
		});
	});

	suite("when presignedPutObject fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (): Promise<string> => {
				throw new Error("Simulated failure");
			};
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "presigned-url-org-failure",
							description: "Organization for presigned URL failure test",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: false,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						organizationId: orgId,
						fileHash: "test-hash-6",
					},
				},
			});

			expect(result.data?.createPresignedUrl).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
							message: expect.stringContaining(
								"Error generating presigned URL: Simulated failure",
							),
						}),
						path: ["createPresignedUrl"],
					}),
				]),
			);

			server.minio.client.presignedPutObject = originalPresignedPutObject;
		});
	});
});
