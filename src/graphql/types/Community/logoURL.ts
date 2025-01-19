import { Community } from "./Community";

Community.implement({
	fields: (t) => ({
		logoURL: t.field({
			description: "URL to the logo of the community.",
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
