import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplicitAuthenticationTokenPayload } from "~/src/graphql/context";
import { createContext } from "~/src/routes/graphql";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock dependencies
vi.mock("@pothos/plugin-complexity", () => ({
	complexityFromQuery: vi.fn(),
}));

vi.mock("~/src/graphql/schemaManager", () => ({
	default: {
		buildInitialSchema: vi.fn(),
		onSchemaUpdate: vi.fn(),
	},
}));

vi.mock("~/src/utilities/leakyBucket", () => ({
	default: vi.fn(),
}));

vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: vi.fn(),
}));

// Import mocked functions
import { complexityFromQuery } from "@pothos/plugin-complexity";
import schemaManager from "~/src/graphql/schemaManager";
import leakyBucket from "~/src/utilities/leakyBucket";

describe("GraphQL Routes", () => {
	let mockFastify: Partial<FastifyInstance>;
	let mockRequest: Partial<FastifyRequest>;
	let mockReply: Partial<FastifyReply>;
	let mockSocket: Partial<WebSocket>;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup mock fastify instance
		mockFastify = {
			drizzleClient: {} as FastifyInstance["drizzleClient"],
			envConfig: {
				API_IS_GRAPHIQL: true,
				API_GRAPHQL_MUTATION_BASE_COST: 10,
				API_RATE_LIMIT_BUCKET_CAPACITY: 100,
				API_RATE_LIMIT_REFILL_RATE: 1,
			} as FastifyInstance["envConfig"],
			jwt: {
				sign: vi.fn().mockReturnValue("signed-jwt-token"),
			} as unknown as FastifyInstance["jwt"],
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: () => {},
				child: vi.fn(),
				level: "info",
				fatal: vi.fn(),
				debug: vi.fn(),
				trace: vi.fn(),
				silent: vi.fn(),
			} as unknown as FastifyInstance["log"],
			minio: {} as FastifyInstance["minio"],
		};

		// Setup mock request
		mockRequest = {
			jwtVerify: vi.fn(),
			ip: "127.0.0.1",
		};

		// Setup mock reply
		mockReply = {};

		// Setup mock socket
		mockSocket = {};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createContext", () => {
		it("should create context for authenticated user", async () => {
			const mockJwtPayload: ExplicitAuthenticationTokenPayload = {
				user: {
					id: "user-123",
					// Use partial type to avoid complex type issues
				} as ExplicitAuthenticationTokenPayload["user"],
			};

			mockRequest.jwtVerify = vi.fn().mockResolvedValue(mockJwtPayload);

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			expect(context).toEqual({
				currentClient: {
					isAuthenticated: true,
					user: mockJwtPayload.user,
				},
				drizzleClient: mockFastify.drizzleClient,
				envConfig: mockFastify.envConfig,
				jwt: {
					sign: expect.any(Function),
				},
				log: mockFastify.log,
				minio: mockFastify.minio,
				notification: expect.objectContaining({
					queue: [],
				}),
			});

			expect(mockRequest.jwtVerify).toHaveBeenCalled();
		});

		it("should create context for unauthenticated user", async () => {
			mockRequest.jwtVerify = vi
				.fn()
				.mockRejectedValue(new Error("Invalid token"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			expect(context).toEqual({
				currentClient: {
					isAuthenticated: false,
				},
				drizzleClient: mockFastify.drizzleClient,
				envConfig: mockFastify.envConfig,
				jwt: {
					sign: expect.any(Function),
				},
				log: mockFastify.log,
				minio: mockFastify.minio,
				notification: expect.objectContaining({
					queue: [],
				}),
			});

			expect(mockRequest.jwtVerify).toHaveBeenCalled();
		});

		it("should create context for subscription with authenticated user", async () => {
			const mockJwtPayload: ExplicitAuthenticationTokenPayload = {
				user: {
					id: "user-456",
				} as ExplicitAuthenticationTokenPayload["user"],
			};

			mockRequest.jwtVerify = vi.fn().mockResolvedValue(mockJwtPayload);

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: true,
				socket: mockSocket as WebSocket,
			});

			expect(context.currentClient).toEqual({
				isAuthenticated: true,
				user: mockJwtPayload.user,
			});

			expect(mockRequest.jwtVerify).toHaveBeenCalled();
		});

		it("should create context for subscription with unauthenticated user", async () => {
			mockRequest.jwtVerify = vi
				.fn()
				.mockRejectedValue(new Error("Token expired"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: true,
				socket: mockSocket as WebSocket,
			});

			expect(context.currentClient).toEqual({
				isAuthenticated: false,
			});

			expect(mockRequest.jwtVerify).toHaveBeenCalled();
		});

		it("should provide working JWT sign function", async () => {
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No token"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			const testPayload: ExplicitAuthenticationTokenPayload = {
				user: {
					id: "test-user",
				} as ExplicitAuthenticationTokenPayload["user"],
			};

			const signedToken = context.jwt.sign(testPayload);

			expect(signedToken).toBe("signed-jwt-token");
			expect(mockFastify.jwt?.sign).toHaveBeenCalledWith(testPayload);
		});
	});

	describe("GraphQL Plugin Registration", () => {
		let mockFastifyInstance: {
			register: ReturnType<typeof vi.fn>;
			envConfig: {
				API_IS_GRAPHIQL: boolean;
				API_GRAPHQL_MUTATION_BASE_COST: number;
				API_RATE_LIMIT_BUCKET_CAPACITY: number;
				API_RATE_LIMIT_REFILL_RATE: number;
			};
			log: {
				info: ReturnType<typeof vi.fn>;
				error: ReturnType<typeof vi.fn>;
			};
			graphql: {
				replaceSchema: ReturnType<typeof vi.fn>;
				addHook: ReturnType<typeof vi.fn>;
			};
			schemaUpdateCallback?: (schema: GraphQLSchema) => void;
		};

		beforeEach(() => {
			mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
					API_GRAPHQL_MUTATION_BASE_COST: 10,
					API_RATE_LIMIT_BUCKET_CAPACITY: 100,
					API_RATE_LIMIT_REFILL_RATE: 1,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn(),
					addHook: vi.fn(),
				},
			};

			// Mock schema manager
			const mockSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						hello: {
							type: GraphQLString,
							resolve: () => "Hello World",
						},
					},
				}),
				mutation: new GraphQLObjectType({
					name: "Mutation",
					fields: {
						createSomething: {
							type: GraphQLString,
							resolve: () => "Created",
						},
					},
				}),
			});

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);
			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation((callback) => {
				// Store the callback for testing
				mockFastifyInstance.schemaUpdateCallback = callback;
			});
		});

		it("should register mercurius upload with correct configuration", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Check that the first register call is for mercurius upload
			const firstCall = mockFastifyInstance.register.mock.calls[0];
			expect(firstCall).toBeDefined();
			expect(firstCall?.[1]).toEqual({
				maxFieldSize: 1048576, // 1024 * 1024
				maxFiles: 20,
				maxFileSize: 10485760, // 1024 * 1024 * 10
			});
		});

		it("should register mercurius with correct configuration", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Check that the second register call is for mercurius
			const secondCall = mockFastifyInstance.register.mock.calls[1];
			expect(secondCall).toBeDefined();
			expect(secondCall?.[1]).toEqual(
				expect.objectContaining({
					context: expect.any(Function),
					graphiql: {
						enabled: true,
					},
					cache: false,
					path: "/graphql",
					schema: expect.any(GraphQLSchema),
					subscription: expect.objectContaining({
						keepAlive: 30000, // 1000 * 30
						onConnect: expect.any(Function),
						onDisconnect: expect.any(Function),
						verifyClient: expect.any(Function),
					}),
				}),
			);
		});

		it("should handle schema updates successfully", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const newSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						newField: {
							type: GraphQLString,
							resolve: () => "New Field",
						},
					},
				}),
			});

			// Trigger schema update
			mockFastifyInstance.schemaUpdateCallback?.(newSchema);

			expect(mockFastifyInstance.graphql.replaceSchema).toHaveBeenCalledWith(
				newSchema,
			);
			expect(mockFastifyInstance.log.info).toHaveBeenCalledWith(
				"✅ GraphQL Schema Updated Successfully",
				expect.objectContaining({
					timestamp: expect.any(String),
					newSchemaFields: expect.objectContaining({
						queries: expect.any(Array),
						mutations: expect.any(Array),
						subscriptions: expect.any(Array),
					}),
				}),
			);
		});

		it("should handle schema update errors", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Make replaceSchema throw an error
			const testError = new Error("Schema replacement failed");
			mockFastifyInstance.graphql.replaceSchema.mockImplementation(() => {
				throw testError;
			});

			const newSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						test: {
							type: GraphQLString,
							resolve: () => "test",
						},
					},
				}),
			});

			// Trigger schema update
			mockFastifyInstance.schemaUpdateCallback?.(newSchema);

			expect(mockFastifyInstance.log.error).toHaveBeenCalledWith(
				"❌ Failed to Update GraphQL Schema",
				expect.objectContaining({
					error: {
						message: testError.message,
						stack: testError.stack,
						name: testError.name,
					},
					timestamp: expect.any(String),
				}),
			);
		});

		it("should handle non-Error objects in schema update", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Make replaceSchema throw a non-Error object
			mockFastifyInstance.graphql.replaceSchema.mockImplementation(() => {
				throw "String error";
			});

			const newSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						test: {
							type: GraphQLString,
							resolve: () => "test",
						},
					},
				}),
			});

			// Trigger schema update
			mockFastifyInstance.schemaUpdateCallback?.(newSchema);

			expect(mockFastifyInstance.log.error).toHaveBeenCalledWith(
				"❌ Failed to Update GraphQL Schema",
				expect.objectContaining({
					error: "String error",
					timestamp: expect.any(String),
				}),
			);
		});
	});

	describe("preExecution Hook", () => {
		let mockFastifyInstance: {
			register: ReturnType<typeof vi.fn>;
			envConfig: {
				API_IS_GRAPHIQL: boolean;
				API_GRAPHQL_MUTATION_BASE_COST: number;
				API_RATE_LIMIT_BUCKET_CAPACITY: number;
				API_RATE_LIMIT_REFILL_RATE: number;
			};
			log: {
				info: ReturnType<typeof vi.fn>;
				error: ReturnType<typeof vi.fn>;
			};
			graphql: {
				replaceSchema: ReturnType<typeof vi.fn>;
				addHook: ReturnType<typeof vi.fn>;
			};
		};
		let mockSchema: GraphQLSchema;
		let mockContext: {
			definitions: Array<{
				kind: string;
				operation?: string;
				name?: string;
			}>;
		};
		let mockDocument: {
			__currentQuery: Record<string, unknown>;
			reply: {
				request: {
					ip?: string;
					jwtVerify: ReturnType<typeof vi.fn>;
				};
			};
		};
		let mockVariables: Record<string, unknown>;
		let preExecutionHook: (
			schema: GraphQLSchema,
			context: typeof mockContext,
			document: typeof mockDocument,
			variables: typeof mockVariables,
		) => Promise<void>;

		beforeEach(async () => {
			mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
					API_GRAPHQL_MUTATION_BASE_COST: 10,
					API_RATE_LIMIT_BUCKET_CAPACITY: 100,
					API_RATE_LIMIT_REFILL_RATE: 1,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn(),
					addHook: vi.fn(),
				},
			};

			mockSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						hello: {
							type: GraphQLString,
							resolve: () => "Hello World",
						},
					},
				}),
			});

			mockContext = {
				definitions: [
					{
						kind: "OperationDefinition",
						operation: "query",
					},
				],
			};

			mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn(),
					},
				},
			};

			mockVariables = {};

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);
			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(() => {});

			// Import and register the plugin to capture the hook
			const { graphql } = await import("~/src/routes/graphql");
			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Extract the preExecution hook
			const addHookCall = mockFastifyInstance.graphql.addHook.mock.calls.find(
				(call) => call?.[0] === "preExecution",
			);
			preExecutionHook = addHookCall?.[1] as typeof preExecutionHook;
		});

		it("should calculate complexity and allow request for authenticated user", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const mockJwtPayload: ExplicitAuthenticationTokenPayload = {
				user: {
					id: "user-123",
				} as ExplicitAuthenticationTokenPayload["user"],
			};

			mockDocument.reply.request.jwtVerify.mockResolvedValue(mockJwtPayload);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(complexityFromQuery).toHaveBeenCalledWith(
				mockDocument.__currentQuery,
				{
					schema: mockSchema,
					variables: mockVariables,
				},
			);

			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:user:user-123:192.168.1.1",
				100,
				1,
				5,
			);
		});

		it("should add mutation base cost for mutations", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			if (mockContext.definitions[0]) {
				mockContext.definitions[0].operation = "mutation";
			}
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:ip:192.168.1.1",
				100,
				1,
				15, // 5 + 10 (mutation base cost)
			);
		});

		it("should use IP-based rate limiting for unauthenticated users", async () => {
			const mockComplexity = { complexity: 3, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("Invalid token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:ip:192.168.1.1",
				100,
				1,
				3,
			);
		});

		it("should throw error when IP address is not available", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.ip = undefined;
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);

			vi.mocked(TalawaGraphQLError).mockImplementation((config) => {
				const error = new Error(config.message);
				(error as Error & { extensions?: unknown }).extensions =
					config.extensions;
				return error as TalawaGraphQLError;
			});

			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).rejects.toThrow("IP address is not available for rate limiting");

			expect(TalawaGraphQLError).toHaveBeenCalledWith({
				extensions: {
					code: "unexpected",
				},
				message: "IP address is not available for rate limiting",
			});
		});

		it("should throw error when rate limit is exceeded", async () => {
			const mockComplexity = { complexity: 100, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(false);

			vi.mocked(TalawaGraphQLError).mockImplementation((config) => {
				const error = new Error("Rate limit exceeded");
				(error as Error & { extensions?: unknown }).extensions =
					config.extensions;
				return error as TalawaGraphQLError;
			});

			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).rejects.toThrow("Rate limit exceeded");

			expect(TalawaGraphQLError).toHaveBeenCalledWith({
				extensions: { code: "too_many_requests" },
			});
		});

		it("should handle operation without operation definition", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockContext.definitions = [
				{
					kind: "FragmentDefinition",
					name: "TestFragment",
				},
			];

			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			// Should not add mutation base cost since operation type is undefined
			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:ip:192.168.1.1",
				100,
				1,
				5,
			);
		});

		it("should handle subscription operations", async () => {
			const mockComplexity = { complexity: 2, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			if (mockContext.definitions[0]) {
				mockContext.definitions[0].operation = "subscription";
			}
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			// Should not add mutation base cost for subscriptions
			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:ip:192.168.1.1",
				100,
				1,
				2,
			);
		});

		it("should log complexity for debugging", async () => {
			const mockComplexity = { complexity: 42, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(consoleSpy).toHaveBeenCalledWith("Complexity: ", 42);

			consoleSpy.mockRestore();
		});
	});

	describe("Subscription Configuration", () => {
		let mockFastifyInstance: {
			register: ReturnType<typeof vi.fn>;
			envConfig: {
				API_IS_GRAPHIQL: boolean;
			};
			log: {
				info: ReturnType<typeof vi.fn>;
				error: ReturnType<typeof vi.fn>;
			};
			graphql: {
				replaceSchema: ReturnType<typeof vi.fn>;
				addHook: ReturnType<typeof vi.fn>;
			};
			jwt?: {
				verify: ReturnType<typeof vi.fn>;
			};
		};

		beforeEach(() => {
			mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: false,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn(),
					addHook: vi.fn(),
				},
			};

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
				new GraphQLSchema({
					query: new GraphQLObjectType({
						name: "Query",
						fields: {
							hello: {
								type: GraphQLString,
								resolve: () => "Hello",
							},
						},
					}),
				}),
			);
		});

		it("should configure subscription onConnect to reject connections without authorization", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call?.[1]?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};
			const result = await subscriptionConfig.subscription.onConnect({
				payload: { test: "data" }, // No authorization
			});

			expect(result).toBe(false);
		});

		it("should authorize subscription connections with valid Bearer token", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			// Prepare a fake token and decoded payload
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

			// Ensure the buildInitialSchema returns a schema so registration succeeds
			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
				new GraphQLSchema({
					query: new GraphQLObjectType({
						name: "Query",
						fields: {
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			// Mock fastify.jwt.verify to return decoded payload when called with token
			mockFastifyInstance.jwt = { verify: vi.fn().mockResolvedValue(decoded) };

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call?.[1]?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
			});

			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
				}),
			);
		});

		it("should reject subscription connections with invalid Bearer token and log error", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			// Make fastify.jwt.verify throw to simulate invalid token
			mockFastifyInstance.jwt = {
				verify: vi.fn().mockRejectedValue(new Error("Invalid token")),
			};

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call?.[1]?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer invalid-token" },
			});

			expect(result).toBe(false);
			expect(mockFastifyInstance.log.error).toHaveBeenCalled();
		});

		it("should configure subscription onDisconnect as no-op", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call?.[1]?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onDisconnect: (ctx: unknown) => void;
				};
			};

			// Should not throw and return undefined
			expect(() =>
				subscriptionConfig.subscription.onDisconnect({}),
			).not.toThrow();
			expect(subscriptionConfig.subscription.onDisconnect({})).toBeUndefined();
		});

		it("should configure subscription verifyClient to accept all connections", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call) => call?.[1]?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					verifyClient: (
						info: unknown,
						next: (result: boolean) => void,
					) => void;
				};
			};
			const mockNext = vi.fn();

			subscriptionConfig.subscription.verifyClient({ test: "info" }, mockNext);

			expect(mockNext).toHaveBeenCalledWith(true);
		});
	});
});
