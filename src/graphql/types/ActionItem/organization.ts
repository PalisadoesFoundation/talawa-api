import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./actionItem";

export const resolveOrganization = async (
	parent: { organizationId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<Organization> => {
	// 1. Ensure there is an organizationId
	if (!parent.organizationId) {
		ctx.log.error("Action item is missing an organizationId.");
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// 2. Fetch the organization
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId as string),
		});

	// 3. If not found, log and throw
	if (!existingOrganization) {
		ctx.log.error(
			`Postgres select operation returned no row for action item's organizationId: ${parent.organizationId}.`,
		);
		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	// 4. Return the organization
	return existingOrganization;
};

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
