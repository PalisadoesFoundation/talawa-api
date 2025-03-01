import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "../../builder";
import { UploadUrlResponse } from "../../types/Post/UploadUrlResponse";

const MutationCreatePresignedUrlInput = builder.inputType(
	"MutationCreatePresignedUrlInput",
	{
		fields: (t) => ({
			fileName: t.string({ required: true }),
			fileType: t.string({ required: true }),
			organizationId: t.id({ required: true }),
		}),
	},
);

builder.mutationField("createPresignedUrl", (t) =>
	t.field({
		args: {
			input: t.arg({
				required: true,
				type: MutationCreatePresignedUrlInput,
			}),
		},
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

			const { fileName } = args.input;
			const bucketName = ctx.minio.bucketName;
			const objectName = `uploads/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

			try {
				const presignedUrl: string = await new Promise((resolve, reject) => {
					ctx.minio.client
						.presignedPutObject(bucketName, objectName, 60)
						.then(resolve)
						.catch(reject);
				});

				const fileUrl = `http://${ctx.minio.config.endPoint}:${ctx.minio.config.port}/${bucketName}/${objectName}`;

				return { presignedUrl, fileUrl, objectName };
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
