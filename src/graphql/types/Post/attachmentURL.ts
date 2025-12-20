import envConfig from "~/src/utilities/graphqLimits";
import { escapeHTML } from "~/src/utilities/sanitizer";
import { Post } from "./Post";

Post.implement({
	fields: (t) => ({
		attachmentURL: t.field({
			description: "URL to the image attachment of the post.",
			// Using API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST despite having a resolver because resolver only does simple logic
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
				// Check if there's an attachment (single file upload)
				if (!parent.attachments || parent.attachments.length === 0) {
					return null;
				}

				// Get the single attachment
				const attachment = parent.attachments[0];

				// Ensure it's an image attachment
				if (!attachment || !attachment.mimeType?.startsWith("image/")) {
					return null;
				}

				if (!attachment.name || !attachment.objectName) {
					return null;
				}

				return escapeHTML(
					new URL(
						`/objects/${attachment.objectName}`,
						ctx.envConfig.API_BASE_URL,
					).toString(),
				);
			},
			type: "String",
		}),
	}),
});
