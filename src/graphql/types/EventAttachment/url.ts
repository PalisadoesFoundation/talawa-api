// check-sanitization-disable: URL field - validated by URL constructor, escaping would break query parameters
import envConfig from "~/src/utilities/graphqLimits";
import { EventAttachment } from "./EventAttachment";

EventAttachment.implement({
	fields: (t) => ({
		url: t.field({
			description: "URL to the attachment.",
			// Using API_GRAPHQL_SCALAR_FIELD_COST despite having a resolver because resolver only does simple string manipulation
			complexity: envConfig.API_GRAPHQL_SCALAR_FIELD_COST,
			resolve: async (parent, _args, ctx) =>
				new URL(
					`/objects/${parent.name}`,
					ctx.envConfig.API_BASE_URL,
				).toString(),
			type: "String",
		}),
	}),
});
