import envConfig from "~/src/utilities/graphqLimits";
import { escapeHTML } from "~/src/utilities/sanitizer";
import { Post } from "./Post";

Post.implement({
	fields: (t) => ({
		attachmentURL: t.field({
			description: "URL to the media attachment (image or video) of the post.",
			// Using API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST despite having a resolver because resolver only does simple logic
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: (parent, _args, ctx) => {
				// Check if there's an attachment available
				if (!parent.attachments || !parent.attachments[0]) {
					return null;
				}

				// Get the single attachment
				const attachment = parent.attachments[0];
				const encodedObjectName = encodeURIComponent(attachment.objectName);
				return escapeHTML(
					new URL(
						`/objects/${encodedObjectName}`,
						ctx.envConfig.API_BASE_URL,
					).toString(),
				);
			},
			type: "String",
		}),
	}),
});
