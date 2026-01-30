import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	FundCampaignPledge,
	type FundCampaignPledge as FundCampaignPledgeType,
} from "./FundCampaignPledge";

export const resolveCreator = async (
	parent: FundCampaignPledgeType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	if (!parent.creatorId) {
		return null;
	}

	const creator = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.creatorId as string),
	});

	if (!creator) {
		ctx.log.error(`No user found for creatorId: ${parent.creatorId}`);
		return null;
	}

	return creator;
};

FundCampaignPledge.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the fund campaign pledge.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveCreator,
			type: User,
		}),
	}),
});
