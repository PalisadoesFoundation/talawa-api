import { GraphQLError } from "graphql";
import { builder } from "../../builder";
import { UploadUrlResponse } from "../../types/Post/UploadUrlResponse";

builder.mutationField("generatePresignedUrl", (t) =>
	t.field({
		type: UploadUrlResponse,
		args: {
			fileName: t.arg.string({ required: true }),
			fileType: t.arg.string({ required: true }),
		},
		resolve: async (_parent, args, ctx) => {
			const { fileName } = args;
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
					throw new GraphQLError(
						`Error generating presigned URL: ${error.message}`,
					);
				}
				throw new GraphQLError("An unknown error occurred");
			}
		},
	}),
);
