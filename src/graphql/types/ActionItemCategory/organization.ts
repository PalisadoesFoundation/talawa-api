import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./ActionItemCategory";

/**
 * Resolver for the "organization" field on ActionItemCategory.
 * Ensures the category has a valid organizationId and returns the Organization.
 */

export const resolveCategoryOrganization = async (
	parent: { organizationId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Organization> => {
	// 1. Ensure organizationId exists
	if (!parent.organizationId) {
		ctx.log.error("Action item category is missing an organizationId.");
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// 2. Query the organizationsTable for the given ID
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId as string),
		});

	// 3. Handle not found
	if (!existingOrganization) {
		ctx.log.error(
			`Postgres select operation returned no row for action item category's organizationId: ${parent.organizationId}.`,
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// 4. Return the organization
	return existingOrganization;
};

// Wire the resolver into ActionItemCategory type
ActionItemCategory.implement({
	fields: (t) => ({
		organization: t.field({
			type: Organization,
			nullable: false,
			description:
				"Fetch the organization associated with this action item category.",
			resolve: resolveCategoryOrganization,
		}),
	}),
});
