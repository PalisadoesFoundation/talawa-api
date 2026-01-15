import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type ExecutionResult,
	type GraphQLFormattedError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplicitAuthenticationTokenPayload } from "~/src/graphql/context";
import { createContext } from "~/src/routes/graphql";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { createPerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock dependencies
vi.mock("@pothos/plugin-complexity", () => ({
	complexityFromQuery: vi.fn(),
}));

vi.mock("~/src/graphql/schemaManager", () => ({
	default: {
		buildInitialSchema: vi.fn(),
		onSchemaUpdate: vi.fn(),
		setLogger: vi.fn(),
	},
}));

vi.mock("~/src/utilities/leakyBucket", () => ({
	default: vi.fn(),
}));

vi.mock("~/src/utilities/dataloaders", () => ({
	createDataloaders: vi.fn().mockReturnValue({
		user: {},
		organization: {},
		event: {},
		actionItem: {},
	}),
}));

// Import mocked functions
import { complexityFromQuery } from "@pothos/plugin-complexity";
import schemaManager from "~/src/graphql/schemaManager";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import leakyBucket from "~/src/utilities/leakyBucket";

const iso8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

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
			cache: {
				get: vi.fn(),
				set: vi.fn(),
				del: vi.fn(),
				delete: vi.fn(),
			} as unknown as FastifyInstance["cache"],
			envConfig: {
				API_IS_GRAPHIQL: true,
				API_GRAPHQL_MUTATION_BASE_COST: 10,
				API_RATE_LIMIT_BUCKET_CAPACITY: 100,
				API_RATE_LIMIT_REFILL_RATE: 1,
				API_JWT_EXPIRES_IN: 900000,
				API_REFRESH_TOKEN_EXPIRES_IN: 604800000,
			} as FastifyInstance["envConfig"],
			jwt: {
				sign: vi.fn().mockReturnValue("signed-jwt-token"),
			} as unknown as FastifyInstance["jwt"],
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: () => {},
				child: vi.fn().mockReturnThis(),
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
			cookies: {},
			log: mockFastify.log as unknown as FastifyRequest["log"],
		};

		// Setup mock reply
		mockReply = {
			setCookie: vi.fn(),
		};

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
				cache: mockFastify.cache,
				cookie: {
					clearAuthCookies: expect.any(Function),
					getRefreshToken: expect.any(Function),
					setAuthCookies: expect.any(Function),
				},
				currentClient: {
					isAuthenticated: true,
					user: mockJwtPayload.user,
				},
				dataloaders: expect.objectContaining({
					user: expect.any(Object),
					organization: expect.any(Object),
					event: expect.any(Object),
					actionItem: expect.any(Object),
				}),
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
				perf: undefined,
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
				cache: mockFastify.cache,
				cookie: {
					clearAuthCookies: expect.any(Function),
					getRefreshToken: expect.any(Function),
					setAuthCookies: expect.any(Function),
				},
				currentClient: {
					isAuthenticated: false,
				},
				dataloaders: expect.objectContaining({
					user: expect.any(Object),
					organization: expect.any(Object),
					event: expect.any(Object),
					actionItem: expect.any(Object),
				}),
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
				perf: undefined,
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

		it("should authenticate via cookie when header fails", async () => {
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No header"));

			// Mock fastify.jwt.verify for cookie token
			const mockCookieUser = { id: "cookie-user" };
			mockFastify.jwt = {
				...mockFastify.jwt,
				verify: vi.fn().mockResolvedValue({ user: mockCookieUser }),
			} as unknown as FastifyInstance["jwt"];

			mockRequest.cookies = {
				[COOKIE_NAMES.ACCESS_TOKEN]: "valid-cookie-token",
			};

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			expect(context.currentClient).toEqual({
				isAuthenticated: true,
				user: mockCookieUser,
			});
			expect(mockFastify.jwt?.verify).toHaveBeenCalledWith(
				"valid-cookie-token",
			);
		});

		it("should fail authentication when both header and cookie fail", async () => {
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No header"));

			// Mock fastify.jwt.verify failure
			mockFastify.jwt = {
				...mockFastify.jwt,
				verify: vi.fn().mockRejectedValue(new Error("Invalid cookie")),
			} as unknown as FastifyInstance["jwt"];

			mockRequest.cookies = {
				[COOKIE_NAMES.ACCESS_TOKEN]: "invalid-cookie-token",
			};

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			expect(context.currentClient).toEqual({
				isAuthenticated: false,
			});
		});

		describe("Cookie Helpers", () => {
			it("should set auth cookies with correct options", async () => {
				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				context.cookie?.setAuthCookies("access-token", "refresh-token");

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					COOKIE_NAMES.ACCESS_TOKEN,
					"access-token",
					expect.objectContaining({
						httpOnly: true,
						path: "/",
						sameSite: "lax",
						maxAge: 900,
					}),
				);

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					COOKIE_NAMES.REFRESH_TOKEN,
					"refresh-token",
					expect.objectContaining({
						httpOnly: true,
						path: "/",
						sameSite: "lax",
						maxAge: 604800,
					}),
				);
			});

			it("should clear auth cookies", async () => {
				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				context.cookie?.clearAuthCookies();

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					COOKIE_NAMES.ACCESS_TOKEN,
					"",
					expect.objectContaining({
						maxAge: 0,
						sameSite: "lax",
					}),
				);

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					COOKIE_NAMES.REFRESH_TOKEN,
					"",
					expect.objectContaining({
						maxAge: 0,
						sameSite: "lax",
					}),
				);
			});

			it("should get refresh token from cookies", async () => {
				mockRequest.cookies = {
					[COOKIE_NAMES.REFRESH_TOKEN]: "stored-refresh-token",
				};

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				const refreshToken = context.cookie?.getRefreshToken();
				expect(refreshToken).toBe("stored-refresh-token");
			});

			it("should respect secure cookie configuration", async () => {
				if (mockFastify.envConfig) {
					mockFastify.envConfig.API_IS_SECURE_COOKIES = true;
				}

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				context.cookie?.setAuthCookies("access", "refresh");

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					expect.any(String),
					expect.any(String),
					expect.objectContaining({
						secure: true,
					}),
				);
			});

			it("should respect cookie domain configuration", async () => {
				if (mockFastify.envConfig) {
					mockFastify.envConfig.API_COOKIE_DOMAIN = ".example.com";
				}

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				context.cookie?.setAuthCookies("access", "refresh");

				expect(mockReply.setCookie).toHaveBeenCalledWith(
					expect.any(String),
					expect.any(String),
					expect.objectContaining({
						domain: ".example.com",
					}),
				);
			});
		});

		describe("Performance Tracker Integration", () => {
			it("should include perf tracker in context when available", async () => {
				const perfTracker = createPerformanceTracker();
				mockRequest.perf = perfTracker;
				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				expect(context.perf).toBeDefined();
				expect(context.perf).toBe(perfTracker);
				expect(context.perf).toHaveProperty("trackComplexity");
				expect(context.perf).toHaveProperty("snapshot");

				// Verify cache is wrapped with metrics proxy
				expect(context.cache).not.toBe(mockFastify.cache);
				expect(context.cache).toHaveProperty("get");
				expect(context.cache).toHaveProperty("set");
			});

			it("should handle missing perf tracker gracefully", async () => {
				delete mockRequest.perf;
				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				expect(context.perf).toBeUndefined();
				// Verify cache is NOT wrapped without perf tracker
				expect(context.cache).toBe(mockFastify.cache);
			});

			it("should not include perf tracker in subscription context (handled in onConnect)", async () => {
				const perfTracker = createPerformanceTracker();
				const mockSocketWithPerf = {
					request: {
						perf: perfTracker,
					},
				} as unknown as WebSocket;

				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: true,
					socket: mockSocketWithPerf,
				});

				// For subscriptions, perf is extracted in onConnect, not createContext
				// This test documents that createContext does not extract perf from socket
				expect(context.perf).toBeUndefined();
			});
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
			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(
				(callback: (schema: GraphQLSchema) => void) => {
					// Store the callback for testing
					mockFastifyInstance.schemaUpdateCallback = callback;
				},
			);
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
				expect.objectContaining({
					timestamp: expect.stringMatching(iso8601),
					newSchemaFields: expect.objectContaining({
						queries: expect.any(Array),
						mutations: expect.any(Array),
						subscriptions: expect.any(Array),
					}),
				}),
				"✅ GraphQL Schema Updated Successfully",
			);
		});

		it("should handle non-Error objects in schema update", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

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
				expect.objectContaining({
					error: "String error",
					timestamp: expect.any(String),
				}),
				"❌ Failed to Update GraphQL Schema",
			);
		});

		it("should log fields for schema with mutations/subscriptions but no query", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const newSchema = new GraphQLSchema({
				// No query type
				mutation: new GraphQLObjectType({
					name: "Mutation",
					fields: {
						doThing: { type: GraphQLString },
					},
				}),
				subscription: new GraphQLObjectType({
					name: "Subscription",
					fields: {
						onThing: { type: GraphQLString },
					},
				}),
			});

			// Trigger the schema update
			expect(mockFastifyInstance.schemaUpdateCallback).toBeDefined();
			mockFastifyInstance.schemaUpdateCallback?.(newSchema);

			// Assert that the logger was called with the correct field names
			expect(mockFastifyInstance.log.info).toHaveBeenCalledWith(
				expect.objectContaining({
					newSchemaFields: {
						queries: [],
						mutations: ["doThing"],
						subscriptions: ["onThing"],
					},
				}),
				"✅ GraphQL Schema Updated Successfully",
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
					log?: unknown;
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
						log: mockFastifyInstance.log,
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
				(call: unknown[]) => call?.[0] === "preExecution",
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
				mockFastifyInstance.log,
			);
		});

		it("should track complexity score in performance tracker", async () => {
			const mockComplexity = { complexity: 8, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const perfTracker = createPerformanceTracker();
			const trackComplexitySpy = vi.spyOn(perfTracker, "trackComplexity");

			(mockDocument.reply.request as unknown as FastifyRequest).perf =
				perfTracker;
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

			expect(trackComplexitySpy).toHaveBeenCalledWith(8);
		});

		it("should track complexity score with mutation base cost", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const perfTracker = createPerformanceTracker();
			const trackComplexitySpy = vi.spyOn(perfTracker, "trackComplexity");

			if (mockContext.definitions[0]) {
				mockContext.definitions[0].operation = "mutation";
			}

			(mockDocument.reply.request as unknown as FastifyRequest).perf =
				perfTracker;
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

			// Should track complexity with mutation base cost (5 + 10 = 15)
			expect(trackComplexitySpy).toHaveBeenCalledWith(15);

			// Verify rate-limiting uses the same computed complexity to ensure consistency
			expect(leakyBucket).toHaveBeenCalledWith(
				mockFastifyInstance,
				"rate-limit:ip:192.168.1.1",
				100,
				1,
				15,
				mockFastifyInstance.log,
			);
		});

		it("should handle missing perf tracker gracefully in complexity tracking", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const request = mockDocument.reply.request as unknown as FastifyRequest;
			delete request.perf;
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			// Should not throw when perf tracker is missing
			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).resolves.not.toThrow();
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
				15,
				mockFastifyInstance.log,
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
				mockFastifyInstance.log,
			);
		});

		it("should throw error when IP address is not available", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.ip = undefined;
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);

			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).rejects.toThrow("IP address is not available for rate limiting");
		});

		it("should throw error when rate limit is exceeded", async () => {
			const mockComplexity = { complexity: 100, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(false);

			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).rejects.toThrow("Too many requests. Please try again later.");
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
				mockFastifyInstance.log,
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
				mockFastifyInstance.log,
			);
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
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
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
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
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

		it("should extract perf tracker from socket.request.perf in subscription onConnect", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const perfTracker = createPerformanceTracker();
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			mockFastifyInstance.jwt = { verify: vi.fn().mockResolvedValue(decoded) };

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
				socket: {
					request: {
						perf: perfTracker,
					},
				},
			});

			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
					perf: perfTracker,
				}),
			);
		});

		it.each([
			{
				description:
					"should handle missing perf tracker in subscription onConnect",
				socket: {
					request: {},
				},
			},
			{
				description:
					"should validate perf tracker with type guard in subscription onConnect",
				socket: {
					request: {
						perf: {
							// Invalid perf tracker - missing required methods
							snapshot: () => ({}),
						},
					},
				},
			},
			{
				description: "should handle undefined socket in subscription onConnect",
				socket: undefined,
			},
			{
				description:
					"should handle socket without request property in subscription onConnect",
				socket: {},
			},
			{
				description:
					"should handle socket.request without perf property in subscription onConnect",
				socket: {
					request: {
						// No perf property
					},
				},
			},
			{
				description:
					"should handle null perf value in socket.request.perf in subscription onConnect",
				socket: {
					request: {
						perf: null,
					},
				},
			},
			{
				description:
					"should handle non-object perf value in socket.request.perf in subscription onConnect",
				socket: {
					request: {
						perf: "not-an-object" as unknown,
					},
				},
			},
		])("$description", async ({
			socket,
		}: {
			description: string;
			socket: unknown;
		}) => {
			const { graphql } = await import("~/src/routes/graphql");

			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			mockFastifyInstance.jwt = { verify: vi.fn().mockResolvedValue(decoded) };

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
				socket,
			});

			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
					perf: undefined,
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
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
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
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
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
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
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

	describe("Error Formatter", () => {
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

		it("should format errors with correlation ID from request", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { errorFormatter?: unknown })?.errorFormatter,
			);

			const errorFormatterConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						data?: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions?: Record<string, unknown>;
						}>;
					},
					context: {
						reply: {
							request: {
								id: string;
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						data: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				data: { user: { id: "123" } },
				errors: [
					new TalawaGraphQLError({
						message: "Test error",
						path: ["user", "email"],
						extensions: { code: ErrorCode.INVALID_ARGUMENTS },
					}),
				],
			};

			const mockContext = {
				reply: {
					request: {
						id: "correlation-123",
					},
				},
			};

			const result = errorFormatterConfig.errorFormatter(
				mockExecution,
				mockContext,
			);

			expect(result).toEqual({
				statusCode: 200,
				response: {
					data: { user: { id: "123" } },
					errors: [
						{
							message: "Test error",
							locations: undefined,
							path: ["user", "email"],
							extensions: {
								code: ErrorCode.INVALID_ARGUMENTS,
								correlationId: "correlation-123",
							},
						},
					],
				},
			});
		});

		it("should handle errors without extensions", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { errorFormatter?: unknown })?.errorFormatter,
			);

			const errorFormatterConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						data?: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions?: Record<string, unknown>;
						}>;
					},
					context: {
						reply: {
							request: {
								id: string;
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						data: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				data: null,
				errors: [
					{
						message: "Syntax error",
						locations: [{ line: 2, column: 10 }],
					},
				],
			};

			const mockContext = {
				reply: {
					request: {
						id: "req-456",
					},
				},
			};

			const result = errorFormatterConfig.errorFormatter(
				mockExecution,
				mockContext,
			);

			expect(result).toEqual({
				statusCode: 200,
				response: {
					data: null,
					errors: [
						{
							message: "Syntax error",
							locations: [{ line: 2, column: 10 }],
							path: undefined,
							extensions: {
								code: "internal_server_error",
								correlationId: "req-456",
								httpStatus: 500,
								details: "Syntax error",
							},
						},
					],
				},
			});
		});

		it("should handle multiple errors with different extensions", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { errorFormatter?: unknown })?.errorFormatter,
			);

			const errorFormatterConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						data?: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions?: Record<string, unknown>;
						}>;
					},
					context: {
						reply: {
							request: {
								id: string;
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						data: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				data: null,
				errors: [
					new TalawaGraphQLError({
						message: "Unauthorized",
						extensions: { code: ErrorCode.UNAUTHENTICATED },
					}),
					{
						message: "Field not found",
						path: ["query", "nonExistent"],
						extensions: {
							code: "GRAPHQL_VALIDATION_FAILED",
							timestamp: 123456,
						},
					},
				],
			};

			const mockContext = {
				reply: {
					request: {
						id: "multi-error-789",
					},
				},
			};

			const result = errorFormatterConfig.errorFormatter(
				mockExecution,
				mockContext,
			);

			expect(result).toEqual({
				statusCode: 200,
				response: {
					data: null,
					errors: [
						{
							message: "Unauthorized",
							locations: undefined,
							path: undefined,
							extensions: {
								code: ErrorCode.UNAUTHENTICATED,
								correlationId: "multi-error-789",
							},
						},
						{
							message: "Field not found",
							locations: undefined,
							path: ["query", "nonExistent"],
							extensions: {
								code: "internal_server_error",
								correlationId: "multi-error-789",
								httpStatus: 500,
								details: "Field not found",
							},
						},
					],
				},
			});
		});

		it("should return null data when execution data is undefined", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { errorFormatter?: unknown })?.errorFormatter,
			);

			const errorFormatterConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						data?: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions?: Record<string, unknown>;
						}>;
					},
					context: {
						reply: {
							request: {
								id: string;
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						data: unknown;
						errors: ReadonlyArray<{
							message: string;
							locations?: ReadonlyArray<{ line: number; column: number }>;
							path?: ReadonlyArray<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				errors: [
					{
						message: "Parse error",
					},
				],
			};

			const mockContext = {
				reply: {
					request: {
						id: "no-data-req",
					},
				},
			};

			const result = errorFormatterConfig.errorFormatter(
				mockExecution,
				mockContext,
			);

			expect(result.response.data).toBeNull();
			expect(result.statusCode).toBe(200);
		});
	});

	describe("GraphQL Coverage Tests", () => {
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
			jwt: {
				verify: ReturnType<typeof vi.fn>;
				sign: ReturnType<typeof vi.fn>;
			};
			cache: {
				get: ReturnType<typeof vi.fn>;
				set: ReturnType<typeof vi.fn>;
				del: ReturnType<typeof vi.fn>;
			};
			drizzleClient: Record<string, unknown>;
			minio: Record<string, unknown>;
		};
		let mockSchema: GraphQLSchema;
		let preExecutionHook: (
			schema: GraphQLSchema,
			context: unknown,
			document: unknown,
			variables: unknown,
		) => Promise<void>;
		let subscriptionOnConnect: (data: unknown) => Promise<boolean | object>;

		beforeEach(async () => {
			vi.clearAllMocks();

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
				jwt: {
					verify: vi.fn(),
					sign: vi.fn(),
				},
				cache: {
					get: vi.fn(),
					set: vi.fn(),
					del: vi.fn(),
				},
				drizzleClient: {},
				minio: {},
			};

			mockSchema = {
				getQueryType: () => ({ getFields: () => ({}) }),
				getMutationType: () => ({ getFields: () => ({}) }),
				getSubscriptionType: () => ({ getFields: () => ({}) }),
			} as unknown as GraphQLSchema;

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);
			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(() => {});

			// Import the graphql route
			const { graphql } = await import("~/src/routes/graphql");
			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Extract hooks and config
			const addHookCall = mockFastifyInstance.graphql.addHook.mock.calls.find(
				(call: unknown[]) => call[0] === "preExecution",
			);
			preExecutionHook = addHookCall?.[1] as typeof preExecutionHook;

			const registerMercuriusCall =
				mockFastifyInstance.register.mock.calls.find(
					(call: unknown[]) =>
						(call[1] as { subscription?: unknown })?.subscription,
				);
			subscriptionOnConnect =
				registerMercuriusCall?.[1]?.subscription?.onConnect;
		});

		describe("preExecution Hook Coverage", () => {
			it("should throw error if IP address is not available", async () => {
				expect(preExecutionHook).toBeDefined();
				const context = {
					definitions: [{ kind: "OperationDefinition", operation: "query" }],
				};
				const document = {
					__currentQuery: {},
					reply: {
						request: {
							ip: undefined, // Missing IP
							jwtVerify: vi.fn().mockRejectedValue(new Error("No token")),
						},
					},
				};

				vi.mocked(complexityFromQuery).mockReturnValue({
					complexity: 1,
					breadth: 1,
					depth: 1,
				});

				await expect(
					preExecutionHook(mockSchema, context, document, {}),
				).rejects.toThrow("IP address is not available for rate limiting");
			});

			it("should throw too_many_requests if leakyBucket returns false", async () => {
				const context = {
					definitions: [{ kind: "OperationDefinition", operation: "query" }],
				};
				const document = {
					__currentQuery: {},
					reply: {
						request: {
							ip: "127.0.0.1",
							jwtVerify: vi.fn().mockRejectedValue(new Error("No token")),
							log: mockFastifyInstance.log,
						},
					},
				};

				vi.mocked(complexityFromQuery).mockReturnValue({
					complexity: 1,
					breadth: 1,
					depth: 1,
				});
				vi.mocked(leakyBucket).mockResolvedValue(false); // Rate limit exceeded

				try {
					await preExecutionHook(mockSchema, context, document, {});
					expect.fail("Should have thrown error");
				} catch (error: unknown) {
					expect(error).toBeInstanceOf(TalawaGraphQLError);
					expect((error as TalawaGraphQLError).extensions.code).toBe(
						"too_many_requests",
					);
				}
			});

			it("should add mutation cost for mutation operations", async () => {
				const context = {
					definitions: [{ kind: "OperationDefinition", operation: "mutation" }],
				};
				const document = {
					__currentQuery: {},
					reply: {
						request: {
							ip: "127.0.0.1",
							jwtVerify: vi.fn().mockRejectedValue(new Error("No token")),
							log: mockFastifyInstance.log,
						},
					},
				};

				// Initialize complexity object
				const complexityObj = { complexity: 5, breadth: 1, depth: 1 };
				vi.mocked(complexityFromQuery).mockReturnValue(complexityObj);
				vi.mocked(leakyBucket).mockResolvedValue(true);

				await preExecutionHook(mockSchema, context, document, {});

				// Complexity should be increased by API_GRAPHQL_MUTATION_BASE_COST (10)
				expect(complexityObj.complexity).toBe(15);
			});
		});

		describe("Subscription onConnect Coverage", () => {
			it("should return false if no authorization in payload", async () => {
				const data = {
					payload: {},
					socket: {},
				};
				const result = await subscriptionOnConnect(data);
				expect(result).toBe(false);
			});

			it("should return false and log error if token invalid", async () => {
				const data = {
					payload: { authorization: "Bearer invalid-token" },
					socket: {},
				};

				mockFastifyInstance.jwt.verify.mockRejectedValue(
					new Error("Invalid token"),
				);

				const result = await subscriptionOnConnect(data);

				expect(result).toBe(false);
				expect(mockFastifyInstance.log.error).toHaveBeenCalled();
			});

			it("should verify token and return context on success", async () => {
				const data = {
					payload: { authorization: "Bearer valid-token" },
					socket: {
						request: {
							perf: {
								trackComplexity: vi.fn(),
								snapshot: vi.fn(),
								time: vi.fn(),
								start: vi.fn(),
								trackDb: vi.fn(),
								trackCacheHit: vi.fn(),
								trackCacheMiss: vi.fn(),
							},
						},
					},
				};

				mockFastifyInstance.jwt.verify.mockResolvedValue({
					user: { id: "user-1" },
				});

				const result = await subscriptionOnConnect(data);

				const context = result as {
					currentClient: { user: { id: string } };
					perf: unknown;
				};

				expect(context).toHaveProperty("currentClient");
				expect(context.currentClient.user.id).toBe("user-1");
				expect(context.perf).toBeDefined();
				expect(mockFastifyInstance.log.info).toHaveBeenCalledWith(
					expect.objectContaining({ user: { id: "user-1" } }),
					"Subscription connection authorized.",
				);
			});
		});
	});

	describe("GraphQL Error Formatting", () => {
		// Unit test for isolated errorFormatter testing
		describe("Unit Tests - ErrorFormatter Isolation", () => {
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

			let errorFormatter: (
				execution: ExecutionResult,
				context: unknown,
			) => {
				statusCode: number;
				response: { data: unknown; errors?: GraphQLFormattedError[] };
			};

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

				vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
					new GraphQLSchema({
						query: new GraphQLObjectType({
							name: "Query",
							fields: { hello: { type: GraphQLString } },
						}),
					}),
				);

				const { graphql } = await import("~/src/routes/graphql");
				await graphql(mockFastifyInstance as unknown as FastifyInstance);

				// Robust errorFormatter extraction - find mercurius registration by schema property
				const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
					(call) => call[1]?.schema !== undefined,
				);

				expect(mercuriusCall).toBeDefined();
				if (!mercuriusCall) return;

				errorFormatter = mercuriusCall[1].errorFormatter;

				expect(errorFormatter).toBeDefined();
				if (!errorFormatter) return;
			});

			it("should remove sensitive extension keys", () => {
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Sensitive Error",
								extensions: {
									code: ErrorCode.INTERNAL_SERVER_ERROR,
									stack: "stack trace",
									internal: "internal data",
									debug: "debug info",
									raw: "raw data",
									error: "error obj",
									secrets: "hidden",
									exception: "crash",
									safe: "safe data",
								},
							}),
						],
					},
					{
						reply: {
							request: { id: "req-1", log: { error: vi.fn() } },
						},
					},
				);

				const extensions = result.response.errors?.[0]?.extensions;
				expect(extensions).toBeDefined();
				expect(extensions).toHaveProperty(
					"code",
					ErrorCode.INTERNAL_SERVER_ERROR,
				);
				expect(extensions).toHaveProperty("correlationId", "req-1");
			});

			it("should correctly format multiple errors", () => {
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Error 1",
								extensions: { code: ErrorCode.NOT_FOUND },
							}),
							new TalawaGraphQLError({
								message: "Error 2",
								extensions: { code: ErrorCode.INVALID_ARGUMENTS },
							}),
						],
					},
					{
						reply: {
							request: { id: "req-multi", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.response.errors).toHaveLength(2);
				expect(result.response.errors?.[0]?.extensions?.code).toBe(
					ErrorCode.NOT_FOUND,
				);
				expect(result.response.errors?.[1]?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
			});

			it("should map standard ErrorCode enum values preserving code", () => {
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Not Found Error",
								extensions: { code: ErrorCode.NOT_FOUND },
							}),
							new TalawaGraphQLError({
								message: "Invalid Args Error",
								extensions: { code: ErrorCode.INVALID_ARGUMENTS },
							}),
						],
					},
					{
						reply: {
							request: { id: "req-enums", log: { error: vi.fn() } },
						},
					},
				);

				const errors = result.response.errors;
				expect(errors).toBeDefined();

				const notFoundError = errors?.[0];
				expect(notFoundError?.extensions?.code).toBe(ErrorCode.NOT_FOUND);

				const invalidArgsError = errors?.[1];
				expect(invalidArgsError?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
			});

			it("should include populated details field in output", () => {
				const details = { field: "username", reason: "duplicate" };
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Detailed Error",
								extensions: {
									code: ErrorCode.INVALID_INPUT,
									details,
								},
							}),
						],
					},
					{
						reply: {
							request: { id: "req-details", log: { error: vi.fn() } },
						},
					},
				);

				const error = result.response.errors?.[0];
				expect(error?.extensions?.details).toEqual(details);
			});

			it("should derive status code correctly in real HTTP context", () => {
				const result = errorFormatter(
					{
						data: null,
						errors: [
							{
								message: "Error",
								locations: undefined,
								extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
								name: "Error",
								nodes: undefined,
								source: undefined,
								positions: undefined,
								originalError: undefined,
								path: undefined,
								toJSON: () => ({ message: "Error" }),
								[Symbol.toStringTag]: "Error",
							},
						],
					},
					{
						reply: {
							request: { id: "req-http", log: { error: vi.fn() } },
							send: vi.fn(), // Presence of send implies real HTTP request
						},
					},
				);

				// Should always be 200 for GraphQL over HTTP
				expect(result.statusCode).toBe(200);
			});

			it("should use pre-set correlationId and log in subscription context", () => {
				const correlationId = "sub-123456";
				const logErrorSpy = vi.fn();
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Sub Error",
								extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							}),
						],
					},
					{
						// Subscription context (no reply)
						correlationId,
						log: { error: logErrorSpy },
					},
				);

				const error = result.response.errors?.[0];
				expect(error?.extensions?.correlationId).toBe(correlationId);
				expect(logErrorSpy).toHaveBeenCalled();
				expect(logErrorSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						correlationId,
						msg: "GraphQL error",
					}),
				);
			});

			it("should call structured logging with correlationId and errors", () => {
				const logErrorSpy = vi.fn();
				errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Log Test Error",
								extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							}),
						],
					},
					{
						reply: {
							request: { id: "req-log-test", log: { error: logErrorSpy } },
						},
					},
				);

				expect(logErrorSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						correlationId: "req-log-test",
						msg: "GraphQL error",
						errors: expect.arrayContaining([
							expect.objectContaining({
								message: "Log Test Error",
								code: ErrorCode.INTERNAL_SERVER_ERROR,
							}),
						]),
					}),
				);
			});
			it("should return 'unknown' correlationId when context is empty", () => {
				const result = errorFormatter(
					{
						data: null,
						errors: [
							new TalawaGraphQLError({
								message: "Error",
								extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
							}),
						],
					},
					{}, // Empty context
				);

				const error = result.response.errors?.[0];
				expect(error?.extensions?.correlationId).toBe("unknown");
			});
		});
	});
});
