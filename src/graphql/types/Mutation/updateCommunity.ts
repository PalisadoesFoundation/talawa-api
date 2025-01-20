import type { FileUpload } from "graphql-upload-minimal";
import { ulid } from "ulidx";
import { z } from "zod";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { communitiesTable } from "~/src/drizzle/tables/communities";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateCommunityInput,
	mutationUpdateCommunityInputSchema,
} from "~/src/graphql/inputs/MutationUpdateCommunityInput";
import { Community } from "~/src/graphql/types/Community/Community";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { isNotNullish } from "~/src/utilities/isNotNullish";

const mutationUpdateCommunityArgumentsSchema = z.object({
	input: mutationUpdateCommunityInputSchema.transform(async (arg, ctx) => {
		let logo:
			| (FileUpload & {
					mimetype: z.infer<typeof imageMimeTypeEnum>;
			  })
			| null
			| undefined;

		if (isNotNullish(arg.logo)) {
			const rawAvatar = await arg.logo;
			const result = imageMimeTypeEnum.safeParse(rawAvatar.mimetype);

			if (!result.success) {
				ctx.addIssue({
					code: "custom",
					path: ["logo"],
					message: `Mime type ${rawAvatar.mimetype} not allowed for this file upload.`,
				});
			} else {
				logo = Object.assign(rawAvatar, {
					mimetype: result.data,
				});
			}

			return {
				...arg,
				logo,
			};
		}

		return {
			...arg,
			logo: arg.logo,
		};
	}),
});

builder.mutationField("updateCommunity", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateCommunityInput,
			}),
		},
		description: "Mutation field to update the community.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				success,
				data: parsedArgs,
				error,
			} = await mutationUpdateCommunityArgumentsSchema.safeParseAsync(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingCommunity] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.communitiesTable.findFirst({
					columns: {
						logoName: true,
					},
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			// Community not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
			if (existingCommunity === undefined) {
				ctx.log.error(
					"Postgres select operation returned an empty array for the community.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			let logoMimeType: z.infer<typeof imageMimeTypeEnum>;
			let logoName: string;

			if (isNotNullish(parsedArgs.input.logo)) {
				logoName =
					existingCommunity.logoName === null
						? ulid()
						: existingCommunity.logoName;
				logoMimeType = parsedArgs.input.logo.mimetype;
			}

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [updatedCommunity] = await tx
					.update(communitiesTable)
					.set({
						facebookURL: parsedArgs.input.facebookURL,
						githubURL: parsedArgs.input.githubURL,
						inactivityTimeoutDuration:
							parsedArgs.input.inactivityTimeoutDuration,
						logoMimeType: isNotNullish(parsedArgs.input.logo)
							? logoMimeType
							: null,
						logoName: isNotNullish(parsedArgs.input.logo) ? logoName : null,
						instagramURL: parsedArgs.input.instagramURL,
						linkedinURL: parsedArgs.input.linkedinURL,
						name: parsedArgs.input.name,
						redditURL: parsedArgs.input.redditURL,
						slackURL: parsedArgs.input.slackURL,
						updaterId: currentUserId,
						websiteURL: parsedArgs.input.websiteURL,
						xURL: parsedArgs.input.xURL,
						youtubeURL: parsedArgs.input.youtubeURL,
					})
					.returning();

				// Updated community not being returned is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (updatedCommunity === undefined) {
					ctx.log.error(
						"Postgres update operation returned an empty array for the community.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				if (isNotNullish(parsedArgs.input.logo)) {
					await ctx.minio.client.putObject(
						ctx.minio.bucketName,
						logoName,
						parsedArgs.input.logo.createReadStream(),
						undefined,
						{
							"content-type": parsedArgs.input.logo.mimetype,
						},
					);
				} else if (
					parsedArgs.input.logo !== undefined &&
					existingCommunity.logoName !== null
				) {
					await ctx.minio.client.removeObject(
						ctx.minio.bucketName,
						existingCommunity.logoName,
					);
				}

				return updatedCommunity;
			});
		},
		type: Community,
	}),
);
