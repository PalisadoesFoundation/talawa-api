// src/graphql/inputs/QueryPluginInput.ts
import { z } from "zod";
import { builder } from "~/src/graphql/builder";

// Define the validation schema
export const queryPluginInputSchema = z.object({
	id: z.string().uuid().optional(), // ID as an optional UUID
	pluginName: z.string().min(1),
});

// Define the GraphQL input type
export const QueryPluginInput = builder
	.inputRef<z.infer<typeof queryPluginInputSchema>>("QueryPluginInput")
	.implement({
		fields: (t) => ({
			id: t.string({
				description: "ID of the plugin to query",
				required: false, // Optional field
			}),
			pluginName: t.string({
				description: "Name of the plugin to query",
				required: true,
			}),
		}),
	});
