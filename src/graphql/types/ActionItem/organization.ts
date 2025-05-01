import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./actionItem";

/**
 * Resolver to fetch the organization associated with an action item.
 * Ensures the organization ID is present and valid.
 */
export const resolveOrganization = async (
	parent: { organizationId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Organization> => {
	// Step 1: Validate that the action item has an organizationId
	if (!parent.organizationId) {
		ctx.log.error("Action item is missing an organizationId.");
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// Step 2: Query the organizations table for the specified organization ID
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId as string),
		});

	// Step 3: Handle the case where no matching organization was found
	if (!existingOrganization) {
		ctx.log.error(
			`Postgres select operation returned no row for action item's organizationId: ${parent.organizationId}.`,
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// Step 4: Return the found organization
	return existingOrganization;
};

// Extend the GraphQL schema for ActionItem to include an "organization" field.
// This allows clients to query which organization a given action item belongs to.
ActionItem.implement({
	fields: (t) => ({
		organization: t.field({
			type: Organization,
			nullable: false,
			description: "Fetch the organization associated with this action item.",
			resolve: resolveOrganization,
		}),
	}),
});
