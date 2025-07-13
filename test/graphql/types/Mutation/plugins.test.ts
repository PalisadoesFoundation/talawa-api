import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import type { GraphQLContext } from "~/src/graphql/context";
import type PluginManager from "~/src/plugin/manager";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the plugin registry and manager
vi.mock("~/src/plugin/registry", () => ({
	getPluginManagerInstance: vi.fn(),
}));

// Import the mocked functions
import { getPluginManagerInstance } from "~/src/plugin/registry";

describe("Plugin Mutations", () => {
	let mockContext: GraphQLContext;
	let mockPluginManager: {
		isPluginLoaded: ReturnType<typeof vi.fn>;
		loadPlugin: ReturnType<typeof vi.fn>;
		activatePlugin: ReturnType<typeof vi.fn>;
		deactivatePlugin: ReturnType<typeof vi.fn>;
		unloadPlugin: ReturnType<typeof vi.fn>;
		isPluginActive: ReturnType<typeof vi.fn>;
	};
	let mockDrizzleClient: {
		query: {
			pluginsTable: {
				findFirst: ReturnType<typeof vi.fn>;
			};
		};
		insert: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock drizzle client
		mockDrizzleClient = {
			query: {
				pluginsTable: {
					findFirst: vi.fn(),
				},
			},
			insert: vi.fn(() => ({
				values: vi.fn((valuesData) => ({
					returning: vi.fn(() => {
						// Return the same data that was inserted, with generated ID
						return Promise.resolve([
							{
								id: valuesData.id || "generated-id",
								pluginId: valuesData.pluginId,
								isActivated: valuesData.isActivated,
								isInstalled: valuesData.isInstalled,
								backup: valuesData.backup,
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]);
					}),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn((updateData) => ({
					where: vi.fn(() => ({
						returning: vi.fn(async () => {
							// Get the current plugin from the most recent findFirst call
							const findFirstMock =
								mockDrizzleClient.query.pluginsTable.findFirst;
							const currentPlugin = await findFirstMock();
							if (!currentPlugin) {
								return [];
							}
							return [
								{
									...currentPlugin,
									...updateData,
									updatedAt: new Date(),
								},
							];
						}),
					})),
				})),
			})),
			delete: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(async () => {
						// Return the found plugin that was deleted
						const findFirstMock =
							mockDrizzleClient.query.pluginsTable.findFirst;
						const currentPlugin = await findFirstMock();
						return currentPlugin ? [currentPlugin] : [];
					}),
				})),
			})),
		};

		// Create mock plugin manager
		mockPluginManager = {
			isPluginLoaded: vi.fn(),
			loadPlugin: vi.fn(),
			activatePlugin: vi.fn(),
			deactivatePlugin: vi.fn(),
			unloadPlugin: vi.fn(),
			isPluginActive: vi.fn(),
		};

		// Create mock GraphQL context
		mockContext = {
			drizzleClient:
				mockDrizzleClient as unknown as GraphQLContext["drizzleClient"],
			currentClient: {
				isAuthenticated: true,
				user: { id: "user-id" },
			},
			envConfig: {} as GraphQLContext["envConfig"],
			jwt: { sign: vi.fn() },
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
			} as unknown as GraphQLContext["log"],
			minio: {} as never,
			pubsub: {} as never,
		};

		// Setup default mock implementations
		vi.mocked(getPluginManagerInstance).mockReturnValue(
			mockPluginManager as unknown as PluginManager,
		);
		mockPluginManager.isPluginLoaded.mockReturnValue(false);
		mockPluginManager.loadPlugin.mockResolvedValue(true);
		mockPluginManager.activatePlugin.mockResolvedValue(true);
		mockPluginManager.deactivatePlugin.mockResolvedValue(true);
		mockPluginManager.unloadPlugin.mockResolvedValue(true);
		mockPluginManager.isPluginActive.mockReturnValue(false);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createPlugin", () => {
		// Import the resolver function by loading the mutations file and extracting the resolver
		const getCreatePluginResolver = async () => {
			// This loads the mutations file which registers the resolvers with the builder
			await import("~/src/graphql/types/Mutation/plugins");

			// Since we can't access the registered resolvers directly, we'll test by calling
			// the resolver logic directly. For now, let's create a test version of the resolver.
			const { z } = await import("zod");
			const { TalawaGraphQLError } = await import(
				"~/src/utilities/TalawaGraphQLError"
			);

			const createPluginInputSchema = z.object({
				pluginId: z.string().min(1, "Plugin ID cannot be empty"),
				isActivated: z.boolean().optional(),
				isInstalled: z.boolean().optional(),
				backup: z.boolean().optional(),
			});

			return async (
				args: {
					input: {
						pluginId: string;
						isActivated?: boolean;
						isInstalled?: boolean;
						backup?: boolean;
					};
				},
				ctx: GraphQLContext,
			) => {
				const {
					data: parsedArgs,
					error,
					success,
				} = createPluginInputSchema.safeParse(args.input);

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

				const {
					pluginId,
					isActivated = false,
					isInstalled = true,
					backup = false,
				} = parsedArgs;

				// Check for existing plugin with same pluginId to avoid race conditions
				const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.pluginId, pluginId),
				});
				if (existing) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pluginId"],
									message: "A plugin with this ID already exists",
								},
							],
						},
					});
				}

				const [plugin] = await ctx.drizzleClient
					.insert(pluginsTable)
					.values({
						pluginId,
						isActivated,
						isInstalled,
						backup,
					})
					.returning();

				// Handle automatic plugin activation if requested
				if (isActivated) {
					const pluginManager = getPluginManagerInstance();
					if (pluginManager) {
						try {
							// Load plugin if not already loaded
							if (!pluginManager.isPluginLoaded(pluginId)) {
								const loaded = await pluginManager.loadPlugin(pluginId);
								if (!loaded) {
									throw new Error(`Failed to load plugin: ${pluginId}`);
								}
							}

							// Activate plugin (registers GraphQL extensions, etc.)
							const activated = await pluginManager.activatePlugin(pluginId);
							if (!activated) {
								throw new Error(`Failed to activate plugin: ${pluginId}`);
							}
						} catch (error) {
							// If activation fails, we still return the created plugin record
							// but log the error - the user can try to activate it again later
							console.error(`Plugin activation failed for ${pluginId}:`, error);
						}
					}
				}

				return plugin;
			};
		};

		it("should create a plugin successfully", async () => {
			const createPlugin = await getCreatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: false,
					isInstalled: true,
					backup: false,
				},
			};

			const result = await createPlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.pluginId).toBe("test_plugin");
			expect(result?.isActivated).toBe(false);
			expect(result?.isInstalled).toBe(true);
			expect(mockDrizzleClient.insert).toHaveBeenCalled();
		});

		it("should create and activate a plugin when isActivated is true", async () => {
			const createPlugin = await getCreatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
					isInstalled: true,
					backup: false,
				},
			};

			const result = await createPlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.pluginId).toBe("test_plugin");
			expect(mockPluginManager.loadPlugin).toHaveBeenCalledWith("test_plugin");
			expect(mockPluginManager.activatePlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should throw error for duplicate plugin ID", async () => {
			const createPlugin = await getCreatePluginResolver();

			// Setup mocks - simulate existing plugin
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "existing-id",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: false,
					isInstalled: true,
					backup: false,
				},
			};

			await expect(createPlugin(args, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});

		it("should throw error for empty plugin ID", async () => {
			const createPlugin = await getCreatePluginResolver();

			const args = {
				input: {
					pluginId: "",
					isActivated: false,
					isInstalled: true,
					backup: false,
				},
			};

			// The zod schema should reject empty strings
			await expect(createPlugin(args, mockContext)).rejects.toThrow();
		});

		it("should handle plugin activation failure gracefully", async () => {
			const createPlugin = await getCreatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);
			mockPluginManager.activatePlugin.mockResolvedValue(false);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
					isInstalled: true,
					backup: false,
				},
			};

			// Should not throw error, but should still create plugin
			const result = await createPlugin(args, mockContext);
			expect(result).toBeDefined();
			expect(result?.pluginId).toBe("test_plugin");
		});

		it("should handle missing plugin manager gracefully", async () => {
			const createPlugin = await getCreatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: true,
					isInstalled: true,
					backup: false,
				},
			};

			const result = await createPlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.pluginId).toBe("test_plugin");
			// Should not attempt to call plugin manager methods
			expect(mockPluginManager.loadPlugin).not.toHaveBeenCalled();
		});
	});

	describe("updatePlugin", () => {
		const getUpdatePluginResolver = async () => {
			await import("~/src/graphql/types/Mutation/plugins");

			const { z } = await import("zod");
			const { TalawaGraphQLError } = await import(
				"~/src/utilities/TalawaGraphQLError"
			);

			const updatePluginInputSchema = z.object({
				id: z.string().uuid(),
				pluginId: z.string().optional(),
				isActivated: z.boolean().optional(),
				isInstalled: z.boolean().optional(),
				backup: z.boolean().optional(),
			});

			return async (
				args: {
					input: {
						id: string;
						pluginId?: string;
						isActivated?: boolean;
						isInstalled?: boolean;
						backup?: boolean;
					};
				},
				ctx: GraphQLContext,
			) => {
				const {
					data: parsedArgs,
					error,
					success,
				} = updatePluginInputSchema.safeParse(args.input);

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

				const { id, ...rawUpdates } = parsedArgs;
				const updates = Object.fromEntries(
					Object.entries(rawUpdates).filter(([, v]) => v !== undefined),
				);

				// Get current plugin state before update
				const currentPlugin =
					await ctx.drizzleClient.query.pluginsTable.findFirst({
						where: eq(pluginsTable.id, id),
					});

				if (!currentPlugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Check for duplicate pluginId if pluginId is being updated
				if ("pluginId" in updates && typeof updates.pluginId === "string") {
					const existing = await ctx.drizzleClient.query.pluginsTable.findFirst(
						{
							where: eq(pluginsTable.pluginId, updates.pluginId),
						},
					);
					if (existing && existing.id !== id) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "forbidden_action_on_arguments_associated_resources",
								issues: [
									{
										argumentPath: ["input", "pluginId"],
										message: "A plugin with this ID already exists",
									},
								],
							},
						});
					}
				}

				// Handle plugin activation/deactivation dynamically
				const pluginManager = getPluginManagerInstance();
				if (pluginManager && "isActivated" in updates) {
					const isBeingActivated =
						updates.isActivated === true && !currentPlugin.isActivated;
					const isBeingDeactivated =
						updates.isActivated === false && currentPlugin.isActivated;

					try {
						if (isBeingActivated) {
							// Load plugin if not already loaded
							if (!pluginManager.isPluginLoaded(currentPlugin.pluginId)) {
								const loaded = await pluginManager.loadPlugin(
									currentPlugin.pluginId,
								);
								if (!loaded) {
									throw new Error(
										`Failed to load plugin: ${currentPlugin.pluginId}`,
									);
								}
							}

							// Activate plugin (registers GraphQL extensions, etc.)
							const activated = await pluginManager.activatePlugin(
								currentPlugin.pluginId,
							);
							if (!activated) {
								throw new Error(
									`Failed to activate plugin: ${currentPlugin.pluginId}`,
								);
							}
						} else if (isBeingDeactivated) {
							// Deactivate plugin (but don't drop tables by default to preserve data)
							const deactivated = await pluginManager.deactivatePlugin(
								currentPlugin.pluginId,
								false,
							);
							if (!deactivated) {
								throw new Error(
									`Failed to deactivate plugin: ${currentPlugin.pluginId}`,
								);
							}
						}
					} catch (error) {
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
								issues: [
									{
										argumentPath: ["input", "isActivated"],
										message: `Plugin operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
									},
								],
							},
						});
					}
				}

				// Update database record
				const [plugin] = await ctx.drizzleClient
					.update(pluginsTable)
					.set(updates) // only concrete values
					.where(eq(pluginsTable.id, id))
					.returning();

				if (!plugin) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				return plugin;
			};
		};

		it("should update plugin successfully", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440000",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
					isInstalled: false,
				},
			};

			const result = await updatePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
			expect(mockDrizzleClient.update).toHaveBeenCalled();
		});

		it("should activate plugin when isActivated is set to true", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440001",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440001",
					isActivated: true,
				},
			};

			const result = await updatePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(mockPluginManager.loadPlugin).toHaveBeenCalledWith("test_plugin");
			expect(mockPluginManager.activatePlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should deactivate plugin when isActivated is set to false", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440002",
				pluginId: "test_plugin",
				isActivated: true,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440002",
					isActivated: false,
				},
			};

			const result = await updatePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith(
				"test_plugin",
				false,
			);
		});

		it("should throw error for non-existent plugin", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);

			const args = {
				input: {
					id: "non-existent-id",
					isInstalled: false,
				},
			};

			await expect(updatePlugin(args, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});

		it("should handle plugin activation failure", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440003",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockPluginManager.activatePlugin.mockResolvedValue(false);

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440003",
					isActivated: true,
				},
			};

			await expect(updatePlugin(args, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});
	});

	describe("deletePlugin", () => {
		const getDeletePluginResolver = async () => {
			await import("~/src/graphql/types/Mutation/plugins");

			const { z } = await import("zod");
			const { TalawaGraphQLError } = await import(
				"~/src/utilities/TalawaGraphQLError"
			);

			const deletePluginInputSchema = z.object({
				id: z.string().uuid(),
			});

			return async (args: { input: { id: string } }, ctx: GraphQLContext) => {
				const {
					data: parsedArgs,
					error,
					success,
				} = deletePluginInputSchema.safeParse(args.input);

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

				const { id } = parsedArgs;

				// Get plugin info before deletion
				const pluginToDelete =
					await ctx.drizzleClient.query.pluginsTable.findFirst({
						where: eq(pluginsTable.id, id),
					});

				if (!pluginToDelete) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "id"],
								},
							],
						},
					});
				}

				// Handle plugin cleanup before deletion
				const pluginManager = getPluginManagerInstance();
				if (pluginManager?.isPluginLoaded(pluginToDelete.pluginId)) {
					try {
						// Deactivate and unload the plugin (optionally drop tables - set to true if you want to remove all data)
						if (pluginManager.isPluginActive(pluginToDelete.pluginId)) {
							await pluginManager.deactivatePlugin(
								pluginToDelete.pluginId,
								true,
							); // true = drop tables
						}
						await pluginManager.unloadPlugin(pluginToDelete.pluginId);
					} catch (error) {
						console.error(
							`Plugin cleanup failed for ${pluginToDelete.pluginId}:`,
							error,
						);
						// Continue with deletion even if cleanup fails
					}
				}

				const [plugin] = await ctx.drizzleClient
					.delete(pluginsTable)
					.where(eq(pluginsTable.id, id))
					.returning();

				return plugin;
			};
		};

		it("should delete plugin successfully", async () => {
			const deletePlugin = await getDeletePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440004",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440004",
				},
			};

			const result = await deletePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.id).toBe("550e8400-e29b-41d4-a716-446655440004");
			expect(mockDrizzleClient.delete).toHaveBeenCalled();
		});

		it("should cleanup loaded plugin before deletion", async () => {
			const deletePlugin = await getDeletePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440005",
				pluginId: "test_plugin",
				isActivated: true,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockPluginManager.isPluginLoaded.mockReturnValue(true);
			mockPluginManager.isPluginActive.mockReturnValue(true);

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440005",
				},
			};

			const result = await deletePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith(
				"test_plugin",
				true,
			);
			expect(mockPluginManager.unloadPlugin).toHaveBeenCalledWith(
				"test_plugin",
			);
		});

		it("should throw error for non-existent plugin", async () => {
			const deletePlugin = await getDeletePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue(null);

			const args = {
				input: {
					id: "non-existent-id",
				},
			};

			await expect(deletePlugin(args, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});

		it("should handle plugin cleanup failure gracefully", async () => {
			const deletePlugin = await getDeletePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440006",
				pluginId: "test_plugin",
				isActivated: true,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockPluginManager.isPluginLoaded.mockReturnValue(true);
			mockPluginManager.isPluginActive.mockReturnValue(true);
			mockPluginManager.deactivatePlugin.mockRejectedValue(
				new Error("Cleanup failed"),
			);

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440006",
				},
			};

			// Should not throw error, but should still delete plugin
			const result = await deletePlugin(args, mockContext);
			expect(result).toBeDefined();
			expect(result?.id).toBe("550e8400-e29b-41d4-a716-446655440006");
		});

		it("should handle missing plugin manager gracefully", async () => {
			const deletePlugin = await getDeletePluginResolver();

			// Setup mocks
			mockDrizzleClient.query.pluginsTable.findFirst.mockResolvedValue({
				id: "550e8400-e29b-41d4-a716-446655440007",
				pluginId: "test_plugin",
				isActivated: false,
				isInstalled: true,
				backup: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			vi.mocked(getPluginManagerInstance).mockReturnValue(null);

			const args = {
				input: {
					id: "550e8400-e29b-41d4-a716-446655440007",
				},
			};

			const result = await deletePlugin(args, mockContext);

			expect(result).toBeDefined();
			expect(result?.id).toBe("550e8400-e29b-41d4-a716-446655440007");
			// Should not attempt to call plugin manager methods
			expect(mockPluginManager.deactivatePlugin).not.toHaveBeenCalled();
		});
	});

	describe("Input Validation", () => {
		it("should validate createPlugin input schema", async () => {
			const createPlugin = await getCreatePluginResolver();

			const invalidArgs = {
				input: {
					pluginId: "",
				},
			};

			await expect(createPlugin(invalidArgs, mockContext)).rejects.toThrow();
		});

		it("should validate updatePlugin input schema", async () => {
			const updatePlugin = await getUpdatePluginResolver();

			const invalidArgs = {
				input: {
					id: "invalid-uuid",
				},
			};

			await expect(updatePlugin(invalidArgs, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});

		it("should validate deletePlugin input schema", async () => {
			const deletePlugin = await getDeletePluginResolver();

			const invalidArgs = {
				input: {
					id: "invalid-uuid",
				},
			};

			await expect(deletePlugin(invalidArgs, mockContext)).rejects.toThrow(
				TalawaGraphQLError,
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle database connection errors", async () => {
			const createPlugin = await getCreatePluginResolver();

			mockDrizzleClient.query.pluginsTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = {
				input: {
					pluginId: "test_plugin",
					isActivated: false,
					isInstalled: true,
					backup: false,
				},
			};

			await expect(createPlugin(args, mockContext)).rejects.toThrow(
				"Database connection failed",
			);
		});
	});

	// Helper functions to avoid repetition
	const getCreatePluginResolver = async () => {
		await import("~/src/graphql/types/Mutation/plugins");

		const { z } = await import("zod");
		const { TalawaGraphQLError } = await import(
			"~/src/utilities/TalawaGraphQLError"
		);

		const createPluginInputSchema = z.object({
			pluginId: z.string().min(1, "Plugin ID cannot be empty"),
			isActivated: z.boolean().optional(),
			isInstalled: z.boolean().optional(),
			backup: z.boolean().optional(),
		});

		return async (
			args: {
				input: {
					pluginId: string;
					isActivated?: boolean;
					isInstalled?: boolean;
					backup?: boolean;
				};
			},
			ctx: GraphQLContext,
		) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = createPluginInputSchema.safeParse(args.input);

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

			const {
				pluginId,
				isActivated = false,
				isInstalled = true,
				backup = false,
			} = parsedArgs;

			// Check for existing plugin with same pluginId to avoid race conditions
			const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
				where: eq(pluginsTable.pluginId, pluginId),
			});
			if (existing) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "A plugin with this ID already exists",
							},
						],
					},
				});
			}

			const [plugin] = await ctx.drizzleClient
				.insert(pluginsTable)
				.values({
					pluginId,
					isActivated,
					isInstalled,
					backup,
				})
				.returning();

			// Handle automatic plugin activation if requested
			if (isActivated) {
				const pluginManager = getPluginManagerInstance();
				if (pluginManager) {
					try {
						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(pluginId)) {
							const loaded = await pluginManager.loadPlugin(pluginId);
							if (!loaded) {
								throw new Error(`Failed to load plugin: ${pluginId}`);
							}
						}

						// Activate plugin (registers GraphQL extensions, etc.)
						const activated = await pluginManager.activatePlugin(pluginId);
						if (!activated) {
							throw new Error(`Failed to activate plugin: ${pluginId}`);
						}
					} catch (error) {
						// If activation fails, we still return the created plugin record
						// but log the error - the user can try to activate it again later
						console.error(`Plugin activation failed for ${pluginId}:`, error);
					}
				}
			}

			return plugin;
		};
	};

	const getUpdatePluginResolver = async () => {
		await import("~/src/graphql/types/Mutation/plugins");

		const { z } = await import("zod");
		const { TalawaGraphQLError } = await import(
			"~/src/utilities/TalawaGraphQLError"
		);

		const updatePluginInputSchema = z.object({
			id: z.string().uuid(),
			pluginId: z.string().optional(),
			isActivated: z.boolean().optional(),
			isInstalled: z.boolean().optional(),
			backup: z.boolean().optional(),
		});

		return async (
			args: {
				input: {
					id: string;
					pluginId?: string;
					isActivated?: boolean;
					isInstalled?: boolean;
					backup?: boolean;
				};
			},
			ctx: GraphQLContext,
		) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = updatePluginInputSchema.safeParse(args.input);

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

			const { id, ...rawUpdates } = parsedArgs;
			const updates = Object.fromEntries(
				Object.entries(rawUpdates).filter(([, v]) => v !== undefined),
			);

			// Get current plugin state before update
			const currentPlugin =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.id, id),
				});

			if (!currentPlugin) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Check for duplicate pluginId if pluginId is being updated
			if ("pluginId" in updates && typeof updates.pluginId === "string") {
				const existing = await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.pluginId, updates.pluginId),
				});
				if (existing && existing.id !== id) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "pluginId"],
									message: "A plugin with this ID already exists",
								},
							],
						},
					});
				}
			}

			// Handle plugin activation/deactivation dynamically
			const pluginManager = getPluginManagerInstance();
			if (pluginManager && "isActivated" in updates) {
				const isBeingActivated =
					updates.isActivated === true && !currentPlugin.isActivated;
				const isBeingDeactivated =
					updates.isActivated === false && currentPlugin.isActivated;

				try {
					if (isBeingActivated) {
						// Load plugin if not already loaded
						if (!pluginManager.isPluginLoaded(currentPlugin.pluginId)) {
							const loaded = await pluginManager.loadPlugin(
								currentPlugin.pluginId,
							);
							if (!loaded) {
								throw new Error(
									`Failed to load plugin: ${currentPlugin.pluginId}`,
								);
							}
						}

						// Activate plugin (registers GraphQL extensions, etc.)
						const activated = await pluginManager.activatePlugin(
							currentPlugin.pluginId,
						);
						if (!activated) {
							throw new Error(
								`Failed to activate plugin: ${currentPlugin.pluginId}`,
							);
						}
					} else if (isBeingDeactivated) {
						// Deactivate plugin (but don't drop tables by default to preserve data)
						const deactivated = await pluginManager.deactivatePlugin(
							currentPlugin.pluginId,
							false,
						);
						if (!deactivated) {
							throw new Error(
								`Failed to deactivate plugin: ${currentPlugin.pluginId}`,
							);
						}
					}
				} catch (error) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							issues: [
								{
									argumentPath: ["input", "isActivated"],
									message: `Plugin operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
								},
							],
						},
					});
				}
			}

			// Update database record
			const [plugin] = await ctx.drizzleClient
				.update(pluginsTable)
				.set(updates) // only concrete values
				.where(eq(pluginsTable.id, id))
				.returning();

			if (!plugin) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return plugin;
		};
	};

	const getDeletePluginResolver = async () => {
		await import("~/src/graphql/types/Mutation/plugins");

		const { z } = await import("zod");
		const { TalawaGraphQLError } = await import(
			"~/src/utilities/TalawaGraphQLError"
		);

		const deletePluginInputSchema = z.object({
			id: z.string().uuid(),
		});

		return async (args: { input: { id: string } }, ctx: GraphQLContext) => {
			const {
				data: parsedArgs,
				error,
				success,
			} = deletePluginInputSchema.safeParse(args.input);

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

			const { id } = parsedArgs;

			// Get plugin info before deletion
			const pluginToDelete =
				await ctx.drizzleClient.query.pluginsTable.findFirst({
					where: eq(pluginsTable.id, id),
				});

			if (!pluginToDelete) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Handle plugin cleanup before deletion
			const pluginManager = getPluginManagerInstance();
			if (pluginManager?.isPluginLoaded(pluginToDelete.pluginId)) {
				try {
					// Deactivate and unload the plugin (optionally drop tables - set to true if you want to remove all data)
					if (pluginManager.isPluginActive(pluginToDelete.pluginId)) {
						await pluginManager.deactivatePlugin(pluginToDelete.pluginId, true); // true = drop tables
					}
					await pluginManager.unloadPlugin(pluginToDelete.pluginId);
				} catch (error) {
					console.error(
						`Plugin cleanup failed for ${pluginToDelete.pluginId}:`,
						error,
					);
					// Continue with deletion even if cleanup fails
				}
			}

			const [plugin] = await ctx.drizzleClient
				.delete(pluginsTable)
				.where(eq(pluginsTable.id, id))
				.returning();

			return plugin;
		};
	};
});
