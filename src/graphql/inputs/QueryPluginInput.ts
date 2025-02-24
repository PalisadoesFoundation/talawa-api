// src/graphql/inputs/QueryPluginInput.ts
import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const queryPluginInputSchema = z.object({
	pluginName: z.string().min(1),
});

export const QueryPluginInput = builder
	.inputRef<z.infer<typeof queryPluginInputSchema>>("QueryPluginInput")
	.implement({
		fields: (t) => ({
			pluginName: t.string({
				description: "Name of the plugin to query",
				required: true,
			}),
		}),
	});
