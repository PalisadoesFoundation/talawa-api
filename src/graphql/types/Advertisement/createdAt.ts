import type { Advertisement as AdvertisementType } from "~/src/drizzle/schema";
import type { GQLContext } from "~/src/graphql/context";
//refactored some parts below so that .test.ts file can export from here for testing purposes
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { Advertisement } from "./Advertisement";
export const createdAtResolver = async (
	parent: AdvertisementType,
	_args: Record<string, never>, // No arguments expected for this field
	ctx: GQLContext, // The GraphQL context containing client and DB info
): Promise<Date> => {
	// Explicitly typing the return promise
	// 1. Authentication Check: Ensure a user is logged in.
	if (!ctx.currentClient.isAuthenticated || !ctx.currentClient.user?.id) {
		throw new TalawaGraphQLError({
			message: "Authentication required.", // Added clearer message
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserId = ctx.currentClient.user.id;

	// 2. Fetch User and Relevant Membership: Get the user's roles.
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true, // User's global role (e.g., system admin)
		},
		with: {
			// Fetch only the membership related to the advertisement's organization
			organizationMembershipsWhereMember: {
				columns: {
					role: true, // User's role within that specific organization
				},
				// Filter memberships to only the one matching the parent advertisement's org ID
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
				limit: 1, // We only need one membership record for this check
			},
		},
		// Filter users to find the currently logged-in user
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	// 3. User Existence Check: Should not happen if authenticated, but good practice.
	if (currentUser === undefined) {
		// This case might indicate a data inconsistency.
		throw new TalawaGraphQLError({
			message: "Authenticated user not found in database.", // Added clearer message
			extensions: {
				// Consider if 'internal_server_error' might be more appropriate
				// depending on how Talawa handles this edge case.
				code: "unauthenticated",
			},
		});
	}

	// 4. Authorization Check: Is the user a system admin OR org admin?
	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember?.[0]; // Use optional chaining safely

	const isSystemAdmin = currentUser.role === "administrator";
	const isOrgAdmin =
		currentUserOrganizationMembership?.role === "administrator";

	if (!isSystemAdmin && !isOrgAdmin) {
		// If the user is neither a system admin nor an admin of this specific org...
		throw new TalawaGraphQLError({
			message: "Unauthorized to view this field.", // Added clearer message
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	// 5. Return Data: If checks pass, return the creation date.
	return parent.createdAt;
};

// --- GraphQL Field Implementation ---
// Registers the 'createdAt' field for the Advertisement type in the schema.
Advertisement.implement({
	fields: (t) => ({
		createdAt: t.field({
			description:
				"Date time at the time the advertisement was created. Requires system or organization administrator privileges.", // Updated description
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST, // Set query complexity cost
			// Use the exported, testable resolver function
			resolve: createdAtResolver,
			type: "DateTime", // The GraphQL scalar type for the return value
		}),
	}),
});
