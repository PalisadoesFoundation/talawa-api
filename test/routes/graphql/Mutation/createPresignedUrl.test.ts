import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createOrganization,
	Mutation_createPresignedUrl,
	Mutation_createUser,
	Mutation_deleteCurrentUser,
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
assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
const authToken = signInResult.data.signIn.authenticationToken;

suite("Mutation field createPresignedUrl", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				variables: {
					input: {
						fileName: "testfile.txt",
						fileType: "text/plain",
						organizationId: faker.string.uuid(),
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
		test("should return a presignedUrl, fileUrl, and objectName", async () => {
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (
				bucket: string,
				objectName: string,
				expiry: number,
			): Promise<string> => {
				return "https://example.com/presigned-url";
			};
			assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
			const authToken = signInResult.data.signIn.authenticationToken;

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
						fileType: "text/plain",
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createPresignedUrl).toEqual(
				expect.objectContaining({
					presignedUrl: "https://example.com/presigned-url",
					fileUrl: expect.stringContaining(
						`http://${server.minio.config.endPoint}:${server.minio.config.port}/${server.minio.bucketName}/uploads/`,
					),
					objectName: expect.stringMatching(
						/^uploads\/\d+-[0-9a-fA-F-]+-testfile\.txt$/,
					),
				}),
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
						fileType: "text/plain",
						organizationId: faker.string.uuid(),
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
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
			const adminToken = adminSignInResult.data.signIn.authenticationToken;

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
						fileType: "text/plain",
						organizationId: orgId,
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
						fileType: "text/plain",
						organizationId: orgId,
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
						fileType: "text/plain",
						organizationId: orgId,
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
