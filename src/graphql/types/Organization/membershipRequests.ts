import { type SQL, and, desc, eq, ilike, inArray } from "drizzle-orm";
import { z } from "zod";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { MembershipRequestObject } from "./MembershipRequestObject";
import { Organization } from "./Organization";

// Define arguments schema using Zod
const membershipRequestsArgumentsSchema = z
	.object({
		skip: z.number().optional(),
		first: z.number().optional(),
		where: z
			.object({
				user: z
					.object({
						firstName_contains: z.string().optional(),
					})
					.optional(),
			})
			.optional(),
	})
	.transform((args) => ({
		skip: args.skip ?? 0,
		first: args.first ?? 10,
		where: args.where,
	}));

// Create input types for filtering
const UserWhereInput = builder.inputType("UserWhereInput", {
	fields: (t) => ({
		firstName_contains: t.string({
			description: "Filter by first name containing this string",
		}),
	}),
});

const MembershipRequestWhereInput = builder.inputType(
	"MembershipRequestWhereInput",
	{
		fields: (t) => ({
			user: t.field({
				type: UserWhereInput,
				description: "Filter criteria for user",
			}),
		}),
	},
);

// Add membershipRequests field to Organization type
Organization.implement({
	fields: (t) => ({
		membershipRequests: t.field({
			type: [MembershipRequestObject],
			description: "Membership requests for this organization",
			args: {
				skip: t.arg.int({ description: "Number of items to skip" }),
				first: t.arg.int({ description: "Number of items to return" }),
				where: t.arg({
					type: MembershipRequestWhereInput,
					description: "Filter criteria for membership requests",
				}),
			},
			resolve: async (parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const {
					success,
					error,
					data: parsedArgs,
				} = membershipRequestsArgumentsSchema.safeParse(args);

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

				const { skip, first, where } = parsedArgs;
				const firstName_contains = where?.user?.firstName_contains;

				// Build base query for membership requests
				let query: SQL<unknown> = eq(
					membershipRequestsTable.organizationId,
					parent.id,
				);

				// Add firstName filter if provided
				if (firstName_contains) {
					// Find matching users
					const matchingUsers =
						await ctx.drizzleClient.query.usersTable.findMany({
							where: (fields) => ilike(fields.name, `%${firstName_contains}%`),
							columns: { id: true },
						});

					const userIds = matchingUsers.map((user) => user.id);

					if (userIds.length > 0) {
						query = and(
							query,
							inArray(membershipRequestsTable.userId, userIds),
						) as SQL<unknown>;
					} else {
						return [];
					}
				}

				// Fetch membership requests
				const membershipRequests =
					await ctx.drizzleClient.query.membershipRequestsTable.findMany({
						where: query,
						limit: first,
						offset: skip,
						orderBy: (fields) => [desc(fields.createdAt)],
						with: { user: true },
					});

				return membershipRequests;
			},
		}),
	}),
});
