import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * Plugin Input Types and Schemas
 *
 * This file co-locates Zod validation schemas with GraphQL input types to ensure
 * they stay in sync and reduce import complexity.
 *
 * Usage examples:
 *
 * // Option 1: Import both schema and type separately
 * import { createPluginInputSchema, CreatePluginInput } from "./inputs";
 *
 * // Option 2: Use helper function to get both together
 * import { getCreatePluginInput } from "./inputs";
 * const { schema, type } = getCreatePluginInput();
 *
 * // Option 3: Import all schemas and types
 * import * as PluginInputs from "./inputs";
 */

// Zod schemas for validation
export const queryPluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

export const queryPluginsInputSchema = z.object({
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
});

export const createPluginInputSchema = z.object({
	pluginId: z.string(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

export const updatePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

export const deletePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

// GraphQL input types
export const QueryPluginInput = builder.inputType("QueryPluginInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
});

export const QueryPluginsInput = builder.inputType("QueryPluginsInput", {
	fields: (t) => ({
		pluginId: t.string({ required: false }),
		isActivated: t.boolean({ required: false }),
		isInstalled: t.boolean({ required: false }),
	}),
});

export const CreatePluginInput = builder.inputType("CreatePluginInput", {
	fields: (t) => ({
		pluginId: t.string({ required: true }),
		isActivated: t.boolean({ required: false }),
		isInstalled: t.boolean({ required: false }),
		backup: t.boolean({ required: false }),
	}),
});

export const UpdatePluginInput = builder.inputType("UpdatePluginInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
		pluginId: t.string({ required: false }),
		isActivated: t.boolean({ required: false }),
		isInstalled: t.boolean({ required: false }),
		backup: t.boolean({ required: false }),
	}),
});

export const DeletePluginInput = builder.inputType("DeletePluginInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
});

// Helper functions that return both schema and type
export const getQueryPluginInput = () => ({
	schema: queryPluginInputSchema,
	type: QueryPluginInput,
});

export const getQueryPluginsInput = () => ({
	schema: queryPluginsInputSchema,
	type: QueryPluginsInput,
});

export const getCreatePluginInput = () => ({
	schema: createPluginInputSchema,
	type: CreatePluginInput,
});

export const getUpdatePluginInput = () => ({
	schema: updatePluginInputSchema,
	type: UpdatePluginInput,
});

export const getDeletePluginInput = () => ({
	schema: deletePluginInputSchema,
	type: DeletePluginInput,
});
