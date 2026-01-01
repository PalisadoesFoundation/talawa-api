import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { Plugin } from "~/src/graphql/types/Plugin/Plugin";
import envConfig from "~/src/utilities/graphqLimits";
import { installPluginFromZip } from "~/src/utilities/pluginInstaller";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

export const uploadPluginZipInputSchema = z.object({
	pluginZip: z.custom<Promise<FileUpload>>(),
	activate: z.boolean().optional().default(false),
});

export const UploadPluginZipInput = builder.inputType("UploadPluginZipInput", {
	description: "Input for uploading a plugin zip file",
	fields: (t) => ({
		pluginZip: t.field({
			type: "Upload",
			description: "The plugin zip file to upload",
			required: true,
		}),
		activate: t.boolean({
			description: "Whether to activate the plugin after installation",
			required: false,
		}),
	}),
});

builder.mutationField("uploadPluginZip", (t) =>
	t.field({
		args: {
			input: t.arg({
				required: true,
				type: UploadPluginZipInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_MUTATION_BASE_COST * 10, // Higher cost for file operations
		description: "Upload and install a plugin from a zip file",
		resolve: async (_parent, args, ctx) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = uploadPluginZipInputSchema.safeParse(args.input);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			// Authorization check - only admins can upload plugins
			if (!ctx.currentClient.user?.id) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			const userId = ctx.currentClient.user.id;
			const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, userId),
			});

			if (!currentUser || currentUser.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				});
			}

			try {
				// Install plugin from zip file
				const zipFile = await parsedArgs.pluginZip;
				const result = await installPluginFromZip({
					zipFile,
					drizzleClient: ctx.drizzleClient,
					activate: parsedArgs.activate,
					userId: ctx.currentClient.user.id,
					logger: ctx.log,
				});

				return result.plugin as typeof Plugin.$inferType;
			} catch (error) {
				ctx.log.error({ error }, "Plugin installation failed");

				if (error instanceof TalawaGraphQLError) {
					throw error;
				}

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: `Plugin installation failed: ${
							error instanceof Error ? error.message : "Unknown error"
						}`,
					},
				});
			}
		},
		type: Plugin,
	}),
);
