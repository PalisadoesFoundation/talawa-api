import { MutationCreatePresignedUrlInput } from "~/src/graphql/inputs/MutationCreatePresignedUrlInput";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "../../builder";
import { UploadUrlResponse } from "../../types/Post/UploadUrlResponse";

builder.mutationField("createPresignedUrl", (t) =>
	t.field({
		args: {
			input: t.arg({
				required: true,
				type: MutationCreatePresignedUrlInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Mutation field to create a presigned URL for uploading a file.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}
			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingOrganization] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: {
						countryCode: true,
					},
					with: {
						membershipsWhereOrganization: {
							columns: {
								role: true,
							},
							where: (fields, operators) =>
								operators.eq(fields.memberId, currentUserId),
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, args.input.organizationId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingOrganization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
							},
						],
					},
				});
			}

			const existingFile =
				await ctx.drizzleClient.query.postAttachmentsTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.fileHash, args.input.fileHash),
				});

			if (existingFile) {
				return {
					presignedUrl: null,
					objectName: existingFile.objectName,
					requiresUpload: false,
				};
			}

			const { fileName } = args.input;
			const bucketName = ctx.minio.bucketName;
			const objectName =
				args.input.objectName ||
				`uploads/${args.input.organizationId}/${Date.now()}-${args.input.fileHash}-${fileName}`;

			try {
				let presignedUrl: string = await new Promise((resolve, reject) => {
					ctx.minio.client
						.presignedPutObject(bucketName, objectName, 60)
						.then(resolve)
						.catch(reject);
				});

				// If a public base URL is configured, ensure the URL sent to clients uses it
				if (ctx.minio.config.publicBaseUrl) {
					const u = new URL(presignedUrl);
					const pub = new URL(ctx.minio.config.publicBaseUrl);
					u.protocol = pub.protocol;
					u.host = pub.host; // keeps port if present
					presignedUrl = u.toString();
				}
				return { presignedUrl, objectName, requiresUpload: true };
			} catch (error: unknown) {
				if (error instanceof Error) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							message: `Error generating presigned URL: ${error.message}`,
						},
					});
				}
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: "An unknown error occurred",
					},
				});
			}
		},
		type: UploadUrlResponse,
	}),
);
