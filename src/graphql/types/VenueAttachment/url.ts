import { VenueAttachment } from "./VenueAttachment";

VenueAttachment.implement({
	fields: (t) => ({
		url: t.field({
			description: "URL to the attachment.",
			resolve: async (parent, _args, ctx) =>
				new URL(
					`/objects/${parent.name}`,
					ctx.envConfig.API_BASE_URL,
				).toString(),
			type: "String",
		}),
	}),
});
