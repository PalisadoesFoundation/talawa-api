import { builder } from "~/src/graphql/builder";
import { z } from "zod";

const queryPluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

const queryPluginsInputSchema = z.object({
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
});

const createPluginInputSchema = z.object({
	pluginId: z.string(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

const updatePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
	pluginId: z.string().optional(),
	isActivated: z.boolean().optional(),
	isInstalled: z.boolean().optional(),
	backup: z.boolean().optional(),
});

const deletePluginInputSchema = z.object({
	id: z.string().uuid({ message: "Invalid Plugin ID format" }),
});

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
