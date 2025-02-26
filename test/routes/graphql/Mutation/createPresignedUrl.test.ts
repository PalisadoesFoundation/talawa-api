import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createPresignedUrl, Query_signIn } from "../documentNodes";

suite("Mutation field createPresignedUrl", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				variables: {
					input: {
						fileName: "testfile.txt",
						fileType: "text/plain",
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
		test("should return a presignedUrl and fileUrl", async () => {
			// Override the minio client's presignedPutObject to simulate a successful URL generation.
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (
				bucket: string,
				objectName: string,
				expiry: number,
			): Promise<string> => {
				return "https://example.com/presigned-url";
			};

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

			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						fileType: "text/plain",
					},
				},
			});

			expect(result.data?.createPresignedUrl).toEqual(
				expect.objectContaining({
					presignedUrl: "https://example.com/presigned-url",
					fileUrl: expect.stringContaining(
						`http://${server.minio.config.endPoint}:${server.minio.config.port}/${server.minio.bucketName}/uploads/`,
					),
				}),
			);

			server.minio.client.presignedPutObject = originalPresignedPutObject;
		});
	});

	suite("when presignedPutObject fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			// Override the minio client's presignedPutObject to simulate a failure.
			const originalPresignedPutObject = server.minio.client.presignedPutObject;
			server.minio.client.presignedPutObject = async (): Promise<string> => {
				throw new Error("Simulated failure");
			};

			// Sign in as an authenticated user.
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

			const result = await mercuriusClient.mutate(Mutation_createPresignedUrl, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						fileName: "testfile.txt",
						fileType: "text/plain",
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
