import { MutationCreateGetfileUrlInput } from "~/src/graphql/inputs/MutationCreateGetfileUrlInput";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "../../builder";
import { GetUrlResponse } from "../../types/Post/GetUrlResponse";

builder.mutationField("createGetfileUrl", (t) =>
	t.field({
		args: {
			input: t.arg({
				required: true,
				type: MutationCreateGetfileUrlInput,
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

			const bucketName = ctx.minio.bucketName;
			const objectName = args.input.objectName;

			if (!objectName) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "objectName"],
								message: "Object name is required",
							},
						],
					},
				});
			}

			try {
				const presignedUrl: string = await new Promise((resolve, reject) => {
					ctx.minio.client
						.presignedGetObject(bucketName, objectName, 60)
						.then(resolve)
						.catch(reject);
				});

				return { presignedUrl };
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
		type: GetUrlResponse,
	}),
);
