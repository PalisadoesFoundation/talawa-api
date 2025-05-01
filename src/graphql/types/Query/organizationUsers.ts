// Import utilities from Drizzle ORM and supporting libraries
import { inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";
import type { usersTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Define TypeScript type for a user row based on the Drizzle schema
type UserType = InferSelectModel<typeof usersTable>;

// Zod schema for validating the list of user IDs
const usersByIdsInputSchema = z.object({
	ids: z.array(z.string().uuid()).min(1), // Must be a non-empty array of UUIDs
});

// GraphQL query: Fetch multiple users by a list of IDs
builder.queryField("usersByIds", (t) =>
	t.field({
		type: [User], // The return type is an array of User GraphQL objects
		args: {
			input: t.arg({
				type: builder.inputType("UsersByIdsInput", {
					fields: (t) => ({
						ids: t.field({ type: ["ID"], required: true }),
					}),
				}),
				required: true,
			}),
		},
		description: "Fetch multiple users by their IDs.",
		resolve: async (_parent, args, ctx) => {
			// Ensure the client is authenticated
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			// Validate input using the Zod schema
			const parsedArgs = usersByIdsInputSchema.safeParse(args.input);
			if (!parsedArgs.success) {
				// Return detailed validation errors if input is invalid
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsedArgs.error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const userIds = parsedArgs.data.ids;

			// Query the users table for matching IDs
			const users = await ctx.drizzleClient.query.usersTable.findMany({
				where: (fields, operators) => inArray(fields.id, userIds),
			});

			// Return the matched users
			return users;
		},
	}),
);

// GraphQL query: Fetch all users that belong to a specific organization
builder.queryField("usersByOrganizationId", (t) =>
	t.field({
		description: "Fetch all users that belong to a given organization.",
		type: [User], // The return type is an array of User GraphQL objects
		args: {
			organizationId: t.arg({ type: "ID", required: true }),
		},
		resolve: async (_parent, args, ctx): Promise<UserType[]> => {
			try {
				// Step 1: Get all organization membership records for the given org
				const userMemberships =
					await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
						where: (fields, operators) =>
							operators.eq(fields.organizationId, args.organizationId),
					});

				// Step 2: Extract user IDs from membership records
				const userIds = userMemberships.map(
					(membership) => membership.memberId,
				);

				// If there are no members, return an empty array
				if (userIds.length === 0) return [];

				// Step 3: Fetch the user records by ID
				const users = await ctx.drizzleClient.query.usersTable.findMany({
					where: (fields, operators) => inArray(fields.id, userIds),
				});

				// Return the list of users
				return users;
			} catch (error) {
				// Log and return a generic error if something fails
				console.error("Error fetching users for organization:", error);
				throw new Error("An error occurred while fetching users.");
			}
		},
	}),
);
