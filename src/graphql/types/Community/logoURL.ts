// check-sanitization-disable: URL field - validated by URL constructor, escaping would break query parameters
import envConfig from "~/src/utilities/graphqLimits";
import { Community } from "./Community";

Community.implement({
	fields: (t) => ({
		logoURL: t.field({
			description: "URL to the logo of the community.",
			// Using API_GRAPHQL_SCALAR_FIELD_COST despite having a resolver because resolver only does simple string manipulation
			complexity: envConfig.API_GRAPHQL_SCALAR_FIELD_COST,
			resolve: async (parent, _args, ctx) =>
				parent.logoName === null
					? null
					: new URL(
							`/objects/${parent.logoName}`,
							ctx.envConfig.API_BASE_URL,
						).toString(),
			type: "String",
		}),
	}),
});
