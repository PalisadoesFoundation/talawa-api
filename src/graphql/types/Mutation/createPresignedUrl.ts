import { builder } from "../../builder";
import { UploadUrlResponse } from "../../types/Post/UploadUrlResponse";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";


const MutationCreatePresignedUrlInput = builder.inputType(
	"MutationCreatePresignedUrlInput",
	{
		fields: (t) => ({
			fileName: t.string({ required: true }),
			fileType: t.string({ required: true }),
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
			const { fileName } = args.input;
			const bucketName = ctx.minio.bucketName;
			const objectName = `uploads/${Date.now()}-${fileName}`;

			try {
				const presignedUrl: string = await new Promise((resolve, reject) => {
					ctx.minio.client
						.presignedPutObject(bucketName, objectName, 60)
						.then(resolve)
						.catch(reject);
				});

				// Construct the final file URL
				const fileUrl = `http://${ctx.minio.config.endPoint}:${ctx.minio.config.port}/${bucketName}/${objectName}`;

				return { presignedUrl, fileUrl };
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
