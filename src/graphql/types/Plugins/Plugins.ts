import { z } from "zod";
// src/graphql/types/Plugin/Plugin.ts
import { builder } from "~/src/graphql/builder";

// Define the Plugin type
type Plugin = {
	pluginName: string;
	pluginCreatedBy: string;
	pluginDesc: string;
	uninstalledOrgs: string[];
};

// Define validation schema
export const pluginSchema = z.object({
	pluginName: z.string().min(1),
	pluginCreatedBy: z.string().min(1),
	pluginDesc: z.string().min(1),
	uninstalledOrgs: z.array(z.string()),
});

// Create Plugin object reference
export const PluginRef = builder.objectRef<Plugin>("Plugin");

// Implement Plugin type
PluginRef.implement({
	fields: (t) => ({
		pluginName: t.exposeString("pluginName", {
			description: "Name of the plugin",
		}),
		pluginCreatedBy: t.exposeString("pluginCreatedBy", {
			description: "Creator of the plugin",
		}),
		pluginDesc: t.exposeString("pluginDesc", {
			description: "Description of the plugin",
		}),
		uninstalledOrgs: t.exposeStringList("uninstalledOrgs", {
			description: "List of organization IDs where plugin is not installed",
		}),
	}),
});
