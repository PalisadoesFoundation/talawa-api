import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";

import { chatMembershipsTable } from "~/src/drizzle/tables/chatMemberships";
import { chatsTable } from "~/src/drizzle/tables/chats";

import {
	MutationCreateChatInput,
	mutationCreateChatInputSchema,
} from "~/src/graphql/inputs/MutationCreateChatInput";

import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const argsSchema = z.object({
	input: mutationCreateChatInputSchema,
});

export const CreateChatPayload = builder
	.objectRef<{ _id: string }>("CreateChatPayload")
	.implement({
		fields: (t) => ({ _id: t.exposeID("_id") }),
	});

builder.mutationField("createChat", (t) =>
	t.field({
		type: CreateChatPayload,
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		args: {
			input: t.arg({ type: MutationCreateChatInput, required: true }),
		},

		async resolve(_root, rawArgs, ctx) {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsed = argsSchema.safeParse(rawArgs);
			if (!parsed.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsed.error.issues.map((i) => ({
							argumentPath: i.path,
							message: i.message,
						})),
					},
				});
			}

			const {
				userIds: rawUserIds,
				organizationId,
				isGroup,
				name,
			} = parsed.data.input;
			const me = ctx.currentClient.user.id;

			const org = await ctx.drizzleClient.query.organizationsTable.findFirst({
				where: (o) => eq(o.id, organizationId),
			});
			if (!org) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			const userIds = Array.from(new Set([...rawUserIds, me]));

			const found = await ctx.drizzleClient.query.usersTable.findMany({
				columns: { id: true },
				where: (u) => inArray(u.id, userIds),
			});
			if (found.length !== userIds.length) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "userIds"],
								message: "One or more userIds do not exist.",
							},
						],
					},
				});
			}

			const keyName =
				isGroup && name ? name.trim() : userIds.slice().sort().join("|");

			const chatId = await ctx.drizzleClient.transaction(async (tx) => {
				const inserted = await tx
					.insert(chatsTable)
					.values({
						name: keyName,
						isGroup,
						organizationId,
						creatorId: me,
					})
					.onConflictDoNothing()
					.returning({ id: chatsTable.id });

				let id: string;
				if (inserted.length > 0 && inserted[0]?.id) {
					id = inserted[0].id;
				} else {
					const [row] = await tx
						.select({ id: chatsTable.id })
						.from(chatsTable)
						.where(eq(chatsTable.name, keyName))
						.limit(1);
					if (!row?.id) {
						throw new Error("Failed to retrieve existing chat ID");
					}
					id = row.id;
				}

				await tx
					.insert(chatMembershipsTable)
					.values(
						userIds.map((uid) => ({
							chatId: id,
							memberId: uid,
							role: "regular" as const,
							creatorId: me,
						})),
					)
					.onConflictDoNothing();

				return id;
			});

			return { _id: chatId };
		},
	}),
);
