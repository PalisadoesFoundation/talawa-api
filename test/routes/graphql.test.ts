import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type ExecutionResult,
	type GraphQLFormattedError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { ExplicitAuthenticationTokenPayload } from "~/src/graphql/context";
import {
	createContext,
	extractZodMessage,
	getPublicErrorMessage,
	graphql,
} from "~/src/routes/graphql";
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

vi.mock("~/src/utilities/leakyBucket", () => {
	return {
		complexityLeakyBucket: vi.fn(),
		leakyBucket: vi.fn(),
	};
});

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
import { complexityLeakyBucket } from "~/src/utilities/leakyBucket";

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

			mockRequest.headers = { authorization: "Bearer test-token" };
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
				oauthProviderRegistry: undefined,
				perf: undefined,
			});

			expect(mockRequest.jwtVerify).toHaveBeenCalled();
		});

		it("should create context for unauthenticated user", async () => {
			mockRequest.headers = { authorization: "Bearer invalid-token" };
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
				oauthProviderRegistry: undefined,
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

			mockRequest.headers = { authorization: "Bearer test-token" };
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
			mockRequest.headers = { authorization: "Bearer expired-token" };
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

			it("should use default refresh token expires when not configured", async () => {
				// Remove the refresh token expires config to test the fallback
				if (mockFastify.envConfig) {
					delete (mockFastify.envConfig as Record<string, unknown>)
						.API_REFRESH_TOKEN_EXPIRES_IN;
				}

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				context.cookie?.setAuthCookies("access", "refresh");

				// Should use the default value (604800 seconds = 7 days)
				expect(mockReply.setCookie).toHaveBeenCalledWith(
					COOKIE_NAMES.REFRESH_TOKEN,
					"refresh",
					expect.objectContaining({
						maxAge: 604800, // Default value from DEFAULT_REFRESH_TOKEN_EXPIRES_MS / 1000
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
		const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

		beforeAll(() => {
			vi.stubEnv("NODE_ENV", "test");
		});

		afterAll(() => {
			if (ORIGINAL_NODE_ENV !== undefined) {
				vi.stubEnv("NODE_ENV", ORIGINAL_NODE_ENV);
			} else {
				vi.unstubAllEnvs();
			}
		});
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

		it("should handle Error objects in schema update failure", async () => {
			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const testError = new Error("Schema replacement failed");
			testError.stack = "Error stack trace";
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
				expect.objectContaining({
					error: {
						message: "Schema replacement failed",
						stack: "Error stack trace",
						name: "Error",
					},
					timestamp: expect.any(String),
				}),
				"❌ Failed to Update GraphQL Schema",
			);
		});

		it("should log fields for schema with mutations/subscriptions but no query", async () => {
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

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

			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			// Should track complexity with mutation base cost (5 + 10 = 15)
			expect(trackComplexitySpy).toHaveBeenCalledWith(15);

			// Verify rate-limiting uses the same computed complexity to ensure consistency
			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(false);

			try {
				await preExecutionHook(
					mockSchema,
					mockContext,
					mockDocument,
					mockVariables,
				);
				expect.fail("Should have thrown error");
			} catch (error: unknown) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				expect((error as TalawaGraphQLError).extensions.code).toBe(
					ErrorCode.RATE_LIMIT_EXCEEDED,
				);
			}
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			// Should not add mutation base cost since operation type is undefined
			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await preExecutionHook(
				mockSchema,
				mockContext,
				mockDocument,
				mockVariables,
			);

			// Should not add mutation base cost for subscriptions
			expect(complexityLeakyBucket).toHaveBeenCalledWith(
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

			// Verify that perf was passed to createDataloaders
			expect(result).toHaveProperty("dataloaders");

			// Explicitly check that the perf property is set in the result
			expect((result as { perf: unknown }).perf).toBe(perfTracker);
		});

		it("should handle subscription onConnect without perf tracker", async () => {
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-456" },
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
						// No perf property
					},
				},
			});

			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
					perf: undefined,
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

		it("should include oauthProviderRegistry in subscription context during onConnect (success path)", async () => {
			// Create a mock OAuth provider registry
			const mockOAuthProviderRegistry = {
				get: vi.fn(),
				has: vi.fn(),
				listProviders: vi.fn().mockReturnValue(["google", "github"]),
				register: vi.fn(),
				unregister: vi.fn(),
			};

			// Prepare a fake token and decoded payload
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-oauth-test" },
			} as ExplicitAuthenticationTokenPayload;

			// Setup mock fastify instance with oauthProviderRegistry
			const mockFastifyWithOAuth = {
				...mockFastifyInstance,
				jwt: { verify: vi.fn().mockResolvedValue(decoded) },
				oauthProviderRegistry: mockOAuthProviderRegistry,
			};

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

			await graphql(mockFastifyWithOAuth as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyWithOAuth.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			// Simulate WebSocket subscription connection (triggers onConnect)
			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
			});

			// Assert that the resolver context includes oauthProviderRegistry
			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
					oauthProviderRegistry: mockOAuthProviderRegistry,
				}),
			);

			// Verify oauthProviderRegistry is non-null and has expected methods
			expect(
				(result as { oauthProviderRegistry: unknown }).oauthProviderRegistry,
			).not.toBeNull();
			expect(
				(result as { oauthProviderRegistry: unknown }).oauthProviderRegistry,
			).toBeDefined();
			expect(
				(result as { oauthProviderRegistry: { listProviders: () => string[] } })
					.oauthProviderRegistry.listProviders,
			).toBeDefined();
		});

		it("should handle missing oauthProviderRegistry in subscription context (fallback path)", async () => {
			// Prepare a fake token and decoded payload
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-no-oauth" },
			} as ExplicitAuthenticationTokenPayload;

			// Setup mock fastify instance WITHOUT oauthProviderRegistry
			const mockFastifyWithoutOAuth = {
				...mockFastifyInstance,
				jwt: { verify: vi.fn().mockResolvedValue(decoded) },
				// Note: oauthProviderRegistry is intentionally missing
			};

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

			await graphql(mockFastifyWithoutOAuth as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyWithoutOAuth.register.mock.calls.find(
				(call: unknown[]) =>
					(call?.[1] as { subscription?: unknown })?.subscription,
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: unknown) => Promise<boolean | object>;
				};
			};

			// Simulate WebSocket subscription connection
			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
			});

			// Assert that oauthProviderRegistry is undefined when not provided in fastify instance
			expect(result).toEqual(
				expect.objectContaining({
					currentClient: { isAuthenticated: true, user: decoded.user },
					oauthProviderRegistry: undefined,
				}),
			);

			// Verify oauthProviderRegistry is undefined (error path)
			expect(
				(result as { oauthProviderRegistry: unknown }).oauthProviderRegistry,
			).toBeUndefined();
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
				statusCode: 400,
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
								httpStatus: 400,
							},
						},
					],
				},
			});
		});

		it("should handle errors without extensions", async () => {
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
				statusCode: 500, // Errors without extensions get 500 status
				response: {
					data: null,
					errors: [
						{
							message: "Internal Server Error",
							locations: [{ line: 2, column: 10 }],
							path: undefined,
							extensions: {
								code: ErrorCode.INTERNAL_SERVER_ERROR,
								correlationId: "req-456",
								httpStatus: 500,
								details:
									process.env.NODE_ENV === "production"
										? undefined
										: "Syntax error",
							},
						},
					],
				},
			});
		});

		it("should handle multiple errors with different extensions", async () => {
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
				statusCode: 401, // UNAUTHENTICATED errors have priority and return 401
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
								httpStatus: 401,
							},
						},
						{
							message: "Field not found",
							locations: undefined,
							path: ["query", "nonExistent"],
							extensions: {
								code: ErrorCode.INVALID_ARGUMENTS,
								correlationId: "multi-error-789",
								httpStatus: 400,
							},
						},
					],
				},
			});
		});

		it("should return null data when execution data is undefined", async () => {
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
			expect(result.statusCode).toBe(500); // Errors without extensions get 500 status
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

			it("should preserve TalawaGraphQLError extensions and add correlationId", () => {
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

				// INTERNAL_SERVER_ERROR returns 500 for HTTP context (reply.send present), subscriptions derive status when reply.send is absent
				expect(result.statusCode).toBe(500);
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

			it("should return status code 200 when there are no errors", () => {
				const result = errorFormatter(
					{
						data: { user: { id: "123" } },
						errors: [], // No errors
					},
					{
						reply: {
							request: { id: "success-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(200);
				expect(result.response.data).toEqual({ user: { id: "123" } });
				expect(result.response.errors).toEqual([]);
			});

			it("should handle GraphQL error with TalawaGraphQLError as originalError", () => {
				const originalTalawaError = new TalawaGraphQLError({
					message: "Original Talawa Error",
					extensions: { code: ErrorCode.NOT_FOUND },
				});

				// Create a GraphQL error that wraps the TalawaGraphQLError
				const graphqlError = {
					message: "GraphQL wrapper error",
					locations: undefined,
					path: ["test"],
					originalError: originalTalawaError,
					extensions: {},
					name: "GraphQLError",
					nodes: undefined,
					source: undefined,
					positions: undefined,
					toJSON: () => ({ message: "GraphQL wrapper error" }),
					[Symbol.toStringTag]: "GraphQLError",
				};

				const result = errorFormatter(
					{
						data: null,
						errors: [graphqlError],
					},
					{
						reply: {
							request: { id: "wrapped-error-req", log: { error: vi.fn() } },
						},
					},
				);

				const formattedError = result.response.errors?.[0];
				expect(formattedError?.message).toBe("Original Talawa Error");
				expect(formattedError?.extensions?.code).toBe(ErrorCode.NOT_FOUND);
				expect(formattedError?.path).toEqual(["test"]);
			});

			it("should handle GraphQL validation errors with INVALID_ARGUMENTS and HTTP 400", () => {
				const validationError = {
					message: "Field 'invalidField' doesn't exist on type 'Query'",
					locations: [{ line: 2, column: 3 }],
					path: ["query", "invalidField"],
					extensions: { code: "GRAPHQL_VALIDATION_FAILED" },
					name: "GraphQLError",
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: () => ({
						message: "Field 'invalidField' doesn't exist on type 'Query'",
					}),
					[Symbol.toStringTag]: "GraphQLError",
				};

				const result = errorFormatter(
					{
						data: null,
						errors: [validationError],
					},
					{
						reply: {
							request: { id: "validation-error-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(400);
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
				expect(formattedError?.extensions?.httpStatus).toBe(400);
				expect(formattedError?.message).toBe(
					"Field 'invalidField' doesn't exist on type 'Query'",
				);
			});

			it("should handle BAD_USER_INPUT errors with INVALID_ARGUMENTS and HTTP 400", () => {
				const badInputError = {
					message: "Invalid input provided",
					locations: [{ line: 1, column: 1 }],
					path: ["mutation", "createUser"],
					extensions: { code: "BAD_USER_INPUT" },
					name: "GraphQLError",
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: () => ({ message: "Invalid input provided" }),
					[Symbol.toStringTag]: "GraphQLError",
				};

				const result = errorFormatter(
					{
						data: null,
						errors: [badInputError],
					},
					{
						reply: {
							request: { id: "bad-input-error-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(400);
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
				expect(formattedError?.extensions?.httpStatus).toBe(400);
				expect(formattedError?.message).toBe("Invalid input provided");
			});

			it("should handle error with unknown code and use default 500 status", () => {
				const errorWithUnknownCode = new TalawaGraphQLError({
					message: "Unknown error",
					extensions: {
						code: "UNKNOWN_ERROR_CODE" as ErrorCode,
						// No httpStatus provided
					},
				});

				const result = errorFormatter(
					{
						data: null,
						errors: [errorWithUnknownCode],
					},
					{
						reply: {
							request: { id: "unknown-error-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(500); // Unknown error codes default to 500 status
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.httpStatus).toBe(500);
			});

			it("should handle GRAPHQL_PARSE_FAILED errors with INVALID_ARGUMENTS and HTTP 400", () => {
				const parseFailedError = {
					message: "Syntax Error: Expected Name, found }",
					locations: [{ line: 1, column: 15 }],
					path: undefined,
					extensions: { code: "GRAPHQL_PARSE_FAILED" },
					name: "GraphQLError",
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: () => ({ message: "Syntax Error: Expected Name, found }" }),
					[Symbol.toStringTag]: "GraphQLError",
				};

				const result = errorFormatter(
					{
						data: null,
						errors: [parseFailedError],
					},
					{
						reply: {
							request: { id: "parse-failed-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(400);
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
				expect(formattedError?.extensions?.httpStatus).toBe(400);
				expect(formattedError?.message).toBe(
					"Syntax Error: Expected Name, found }",
				);
			});

			it("should handle Syntax Error messages with INVALID_ARGUMENTS and HTTP 400", () => {
				const syntaxError = {
					message: "Syntax Error: Unexpected character '{'",
					locations: [{ line: 2, column: 5 }],
					path: undefined,
					extensions: { code: "GRAPHQL_SYNTAX_ERROR" },
					name: "GraphQLError",
					nodes: undefined,
					source: undefined,
					positions: undefined,
					originalError: undefined,
					toJSON: () => ({ message: "Syntax Error: Unexpected character '{'" }),
					[Symbol.toStringTag]: "GraphQLError",
				};

				const result = errorFormatter(
					{
						data: null,
						errors: [syntaxError],
					},
					{
						reply: {
							request: { id: "syntax-error-req", log: { error: vi.fn() } },
						},
					},
				);

				expect(result.statusCode).toBe(400);
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.code).toBe(
					ErrorCode.INVALID_ARGUMENTS,
				);
				expect(formattedError?.extensions?.httpStatus).toBe(400);
				expect(formattedError?.message).toBe(
					"Syntax Error: Unexpected character '{'",
				);
			});
		});
	});

	describe("Observability Code Coverage", () => {
		it("should register hooks and execute without throwing", async () => {
			const mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: false,
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

			const mockSchema = new GraphQLSchema({
				query: new GraphQLObjectType({
					name: "Query",
					fields: {
						hello: {
							type: GraphQLString,
							resolve: () => "Hello",
						},
					},
				}),
			});

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			expect(mockFastifyInstance.graphql.addHook).toHaveBeenCalled();

			const addHookCalls = mockFastifyInstance.graphql.addHook.mock.calls;

			const preExecutionHooks = addHookCalls.filter(
				(call: unknown[]) => call?.[0] === "preExecution",
			);

			for (const hookCall of preExecutionHooks) {
				const hook = hookCall[1] as (
					schema: GraphQLSchema,
					context: { definitions: Array<{ kind: string; operation?: string }> },
					document: {
						__currentQuery: Record<string, unknown>;
						reply: {
							request: { ip?: string; jwtVerify?: () => Promise<unknown> };
						};
					},
					variables: Record<string, unknown>,
				) => Promise<void>;

				// Mock leakyBucket to return true (allow request)
				vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

				const mockContext = {
					definitions: [{ kind: "OperationDefinition", operation: "query" }],
				};

				const mockDocument = {
					__currentQuery: {},
					reply: {
						request: {
							ip: "127.0.0.1",
							jwtVerify: vi.fn().mockRejectedValue(new Error("No token")),
						},
					},
				};

				await expect(
					hook(mockSchema, mockContext, mockDocument, {}),
				).resolves.not.toThrow();
			}

			const onResolutionHooks = addHookCalls.filter(
				(call: unknown[]) => call?.[0] === "onResolution",
			);

			for (const hookCall of onResolutionHooks) {
				const hook = hookCall[1] as (
					execution: { errors?: Array<{ message: string }> },
					context: Record<string, unknown>,
				) => Promise<void>;

				await expect(
					hook({ errors: [{ message: "test" }] }, {}),
				).resolves.not.toThrow();

				await expect(hook({}, {})).resolves.not.toThrow();
			}
		});
	});
	describe("Mercurius Context Function Coverage", () => {
		it("should call the mercurius context function", async () => {
			let contextFunction: ((...args: unknown[]) => unknown) | undefined;

			const mockFastifyInstance = {
				register: vi.fn().mockImplementation((_plugin, options) => {
					// Capture the context function from mercurius registration
					if (options && typeof options === "object" && "context" in options) {
						contextFunction = options.context as (
							...args: unknown[]
						) => unknown;
					}
					return Promise.resolve();
				}),
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

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Verify the context function was captured
			expect(contextFunction).toBeDefined();

			if (contextFunction) {
				// Create mock request and reply
				const mockRequest = {
					jwtVerify: vi.fn().mockRejectedValue(new Error("No token")),
					ip: "127.0.0.1",
					cookies: {},
					log: { child: vi.fn().mockReturnThis() },
					body: { operationName: "TestOperation" },
				};

				const mockReply = {
					setCookie: vi.fn(),
				};

				// Call the context function to cover lines 249-254
				const context = await contextFunction(mockRequest, mockReply);

				// Verify the context was created
				expect(context).toBeDefined();
				expect(context).toHaveProperty("currentClient");
				expect(context).toHaveProperty("dataloaders");
				expect(context).toHaveProperty("drizzleClient");
			}
		});
	});

	describe("Final Coverage - Perf Line", () => {
		it("should cover the perf property in subscription onConnect return", async () => {
			// Create a real performance tracker
			const perfTracker = createPerformanceTracker();

			// Verify it passes the type guard
			expect(perfTracker).toHaveProperty("time");
			expect(perfTracker).toHaveProperty("start");
			expect(perfTracker).toHaveProperty("trackComplexity");
			expect(perfTracker).toHaveProperty("snapshot");
			expect(perfTracker).toHaveProperty("trackDb");
			expect(perfTracker).toHaveProperty("trackCacheHit");
			expect(perfTracker).toHaveProperty("trackCacheMiss");

			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-perf-test" },
			} as ExplicitAuthenticationTokenPayload;

			const mockFastifyInstance = {
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
				jwt: { verify: vi.fn().mockResolvedValue(decoded) },
				cache: {},
				drizzleClient: {},
				minio: {},
			};

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

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the subscription configuration
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] && typeof call[1] === "object" && "subscription" in call[1],
			);

			expect(mercuriusCall).toBeDefined();

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: {
						payload?: { authorization?: string };
						socket?: {
							request?: {
								perf?: unknown;
							};
						};
					}) => Promise<boolean | object>;
				};
			};

			expect(subscriptionConfig.subscription.onConnect).toBeDefined();

			// Call onConnect with a proper perf tracker
			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
				socket: {
					request: {
						perf: perfTracker,
					},
				},
			});

			// Verify the result includes the perf tracker
			expect(result).not.toBe(false);
			expect(typeof result).toBe("object");

			const contextResult = result as {
				perf?: unknown;
				currentClient: { isAuthenticated: boolean; user: unknown };
			};

			expect(contextResult.perf).toBe(perfTracker);
			expect(contextResult.currentClient.isAuthenticated).toBe(true);
		});

		it("should cover JWT sign function in subscription onConnect", async () => {
			const fakeToken = "signed-jwt-token";
			const decoded = {
				user: { id: "user-jwt-test" },
			} as ExplicitAuthenticationTokenPayload;

			const mockJwtSign = vi.fn().mockReturnValue("new-signed-token");
			const mockFastifyInstance = {
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
				jwt: {
					verify: vi.fn().mockResolvedValue(decoded),
					sign: mockJwtSign,
				},
				cache: {},
				drizzleClient: {},
				minio: {},
			};

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

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the subscription configuration
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] && typeof call[1] === "object" && "subscription" in call[1],
			);

			const subscriptionConfig = mercuriusCall?.[1] as {
				subscription: {
					onConnect: (data: {
						payload?: { authorization?: string };
					}) => Promise<boolean | object>;
				};
			};

			// Call onConnect to get the context
			const result = await subscriptionConfig.subscription.onConnect({
				payload: { authorization: `Bearer ${fakeToken}` },
			});

			expect(result).not.toBe(false);
			const contextResult = result as {
				jwt: { sign: (payload: ExplicitAuthenticationTokenPayload) => string };
			};

			// Call the JWT sign function to cover the uncovered line
			const signedToken = contextResult.jwt.sign(decoded);
			expect(signedToken).toBe("new-signed-token");
			expect(mockJwtSign).toHaveBeenCalledWith(decoded);
		});
	});

	describe("Error Formatter Status Code Coverage", () => {
		it("should return 403 status code for UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES in non-HTTP context", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: { errors: Array<{ extensions?: { code?: string } }> },
					context: unknown,
				) => { statusCode: number };
			};

			// Test with UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES error in non-HTTP context
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							extensions: {
								code: ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
							},
						},
					],
				},
				{}, // Non-HTTP context (no reply.send method)
			);

			expect(result.statusCode).toBe(403);
		});

		it("should return 429 status code for RATE_LIMIT_EXCEEDED in non-HTTP context", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: { errors: Array<{ extensions?: { code?: string } }> },
					context: unknown,
				) => { statusCode: number };
			};

			// Test with RATE_LIMIT_EXCEEDED error in non-HTTP context
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							extensions: {
								code: ErrorCode.RATE_LIMIT_EXCEEDED,
							},
						},
					],
				},
				{}, // Non-HTTP context (no reply.send method)
			);

			expect(result.statusCode).toBe(429);
		});
	});

	describe("Observability Coverage", () => {
		it("should execute observability tracing code when enabled", async () => {
			try {
				vi.doMock("~/src/config/observability", () => ({
					observabilityConfig: { enabled: true },
				}));

				// Mock OpenTelemetry
				const mockSpan = {
					setAttribute: vi.fn(),
					end: vi.fn(),
				};
				const mockTracer = {
					startSpan: vi.fn().mockReturnValue(mockSpan),
				};

				vi.doMock("@opentelemetry/api", () => ({
					trace: {
						getTracer: vi.fn().mockReturnValue(mockTracer),
					},
				}));

				// Re-import the module to get the mocked version
				vi.resetModules();
				const { graphql: graphqlWithObservability } = await import(
					"~/src/routes/graphql"
				);

				const mockFastifyInstance = {
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
								hello: { type: GraphQLString, resolve: () => "Hello" },
							},
						}),
					}),
				);

				await graphqlWithObservability(
					mockFastifyInstance as unknown as FastifyInstance,
				);

				// Verify observability hooks were added
				expect(mockFastifyInstance.graphql.addHook).toHaveBeenCalledWith(
					"preExecution",
					expect.any(Function),
				);
				expect(mockFastifyInstance.graphql.addHook).toHaveBeenCalledWith(
					"onResolution",
					expect.any(Function),
				);

				// Test the tracing hooks
				const addHookCalls = mockFastifyInstance.graphql.addHook.mock.calls;
				const preExecutionHook = addHookCalls.find(
					(call: unknown[]) =>
						call?.[0] === "preExecution" && call?.[1] !== undefined,
				)?.[1] as (...args: unknown[]) => unknown;

				const onResolutionHook = addHookCalls.find(
					(call: unknown[]) =>
						call?.[0] === "onResolution" && call?.[1] !== undefined,
				)?.[1] as (...args: unknown[]) => unknown;

				// Test preExecution hook
				if (preExecutionHook) {
					const mockDocument = {
						definitions: [
							{
								kind: "OperationDefinition",
								operation: "query",
								name: { value: "TestQuery" },
							},
						],
					};
					const mockContext = {};

					await preExecutionHook(null, mockDocument, mockContext);

					expect(mockTracer.startSpan).toHaveBeenCalledWith(
						"graphql:TestQuery",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.name",
						"TestQuery",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.type",
						"query",
					);
				}

				// Test onResolution hook
				if (onResolutionHook) {
					const mockExecution = {
						errors: [{ message: "Test error" }],
					};
					const mockContext = { _tracingSpan: mockSpan };

					await onResolutionHook(mockExecution, mockContext);

					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.errors.count",
						1,
					);
					expect(mockSpan.end).toHaveBeenCalled();
				}
			} finally {
				// Restore mocks
				vi.doUnmock("~/src/config/observability");
				vi.doUnmock("@opentelemetry/api");
				vi.resetModules();
			}
		});

		it("should handle anonymous operations and unknown operation types in tracing", async () => {
			try {
				// Mock observabilityConfig to be enabled
				vi.doMock("~/src/config/observability", () => ({
					observabilityConfig: { enabled: true },
				}));

				// Mock OpenTelemetry
				const mockSpan = {
					setAttribute: vi.fn(),
					end: vi.fn(),
				};
				const mockTracer = {
					startSpan: vi.fn().mockReturnValue(mockSpan),
				};

				vi.doMock("@opentelemetry/api", () => ({
					trace: {
						getTracer: vi.fn().mockReturnValue(mockTracer),
					},
				}));

				// Re-import the module to get the mocked version
				vi.resetModules();
				const { graphql: graphqlWithObservability } = await import(
					"~/src/routes/graphql"
				);

				const mockFastifyInstance = {
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
								hello: { type: GraphQLString, resolve: () => "Hello" },
							},
						}),
					}),
				);

				await graphqlWithObservability(
					mockFastifyInstance as unknown as FastifyInstance,
				);

				// Get the preExecution hook
				const addHookCalls = mockFastifyInstance.graphql.addHook.mock.calls;
				const preExecutionHook = addHookCalls.find(
					(call: unknown[]) =>
						call?.[0] === "preExecution" && call?.[1] !== undefined,
				)?.[1] as (...args: unknown[]) => unknown;

				if (preExecutionHook) {
					// Test with operation definition that has no name (anonymous)
					const mockDocumentAnonymous = {
						definitions: [
							{
								kind: "OperationDefinition",
								operation: "query",
								// No name property - should fallback to "anonymous"
							},
						],
					};

					await preExecutionHook(null, mockDocumentAnonymous, {});

					expect(mockTracer.startSpan).toHaveBeenCalledWith(
						"graphql:anonymous",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.name",
						"anonymous",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.type",
						"query",
					);

					// Reset mocks for next test
					vi.clearAllMocks();

					// Test with non-operation definition (should fallback to "unknown")
					const mockDocumentUnknown = {
						definitions: [
							{
								kind: "FragmentDefinition", // Not an OperationDefinition
								name: { value: "TestFragment" },
							},
						],
					};

					await preExecutionHook(null, mockDocumentUnknown, {});

					expect(mockTracer.startSpan).toHaveBeenCalledWith(
						"graphql:anonymous",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.name",
						"anonymous",
					);
					expect(mockSpan.setAttribute).toHaveBeenCalledWith(
						"graphql.operation.type",
						"unknown",
					);
				}
			} finally {
				// Restore mocks
				vi.doUnmock("~/src/config/observability");
				vi.doUnmock("@opentelemetry/api");
				vi.resetModules();
			}
		});
	});

	describe("Error Formatter covering Edge Cases and Normalization", () => {
		it("should handle errors with extensions but invalid codes using normalizeError", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
							extensions?: { code?: string; someOtherField?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						errors?: Array<{ message: string; extensions?: { code?: string } }>;
					};
				};
			};

			// Test with error that has extensions but invalid code (not in ErrorCode enum)
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Custom error with invalid code",
							locations: [{ line: 1, column: 1 }],
							path: ["test"],
							extensions: {
								code: "INVALID_CUSTOM_CODE", // Not a valid ErrorCode
								someOtherField: "value",
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalizeError and return secure message
			expect(result.response.errors?.[0]?.message).toBe(
				"Internal Server Error",
			);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			); // normalizeError default
		});

		it("should use normalized message when original message contains Internal Server Error", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
							extensions?: { code?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: { errors?: Array<{ message: string }> };
				};
			};

			// Test with error that has extensions but invalid code and contains "Internal Server Error"
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Internal Server Error occurred", // Contains "Internal Server Error"
							extensions: {
								code: "INVALID_CUSTOM_CODE", // Not a valid ErrorCode
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalized message instead of original
			expect(result.response.errors?.[0]?.message).not.toBe(
				"Internal Server Error occurred",
			);
		});

		it("should handle error with empty message using normalizeError", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: { errors?: Array<{ message: string }> };
				};
			};

			// Test with error that has empty message
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "", // Empty message - should not preserve
							extensions: {
								code: "INVALID_CUSTOM_CODE", // Not a valid ErrorCode
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalized message instead of empty original
			expect(result.response.errors?.[0]?.message).not.toBe("");
		});

		it("should handle error with valid ErrorCode in extensions", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message?: string;
							extensions?: { code?: string; details?: unknown };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						errors?: Array<{ message: string; extensions?: { code?: string } }>;
					};
				};
			};

			// Test with error that has valid ErrorCode in extensions but no message
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							// No message property - should use fallback
							extensions: {
								code: ErrorCode.NOT_FOUND, // Valid ErrorCode
								details: { field: "test" },
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalized message "Internal Server Error" for security
			expect(result.response.errors?.[0]?.message).toBe(
				"Internal Server Error",
			);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.NOT_FOUND,
			);
		});

		it("should handle error without extensions and no message", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message?: string;
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: { errors?: Array<{ message: string }> };
				};
			};

			// Test with error that has no extensions and no message
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							// No message property and no extensions
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalized message "Internal Server Error" for security
			expect(result.response.errors?.[0]?.message).toBe(
				"Internal Server Error",
			);
		});

		it("should use first error httpStatus when no specific error codes match", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string; httpStatus?: number };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => { statusCode: number };
			};

			// Test with TalawaGraphQLError that has custom httpStatus but no matching error codes
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						new TalawaGraphQLError({
							message: "Custom error",
							extensions: {
								code: "CUSTOM_ERROR_CODE" as ErrorCode, // Not in the specific error code checks
								httpStatus: 418, // Custom status code
							},
						}),
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use the first error's httpStatus
			expect(result.statusCode).toBe(418);
		});

		it("should fallback to 500 when first error has no httpStatus", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => { statusCode: number };
			};

			// Test with error that has no httpStatus in extensions
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Custom error",
							extensions: {
								code: "CUSTOM_ERROR_CODE", // Not in the specific error code checks
								// No httpStatus property
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should fallback to 500
			expect(result.statusCode).toBe(500);
		});

		it("should handle context with reply but no request.id", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: { reply?: { request?: { id?: string } } },
				) => {
					statusCode: number;
					response: {
						errors?: Array<{ extensions?: { correlationId?: string } }>;
					};
				};
			};

			// Test with context that has reply but no request.id
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Test error",
							extensions: {
								code: ErrorCode.INTERNAL_SERVER_ERROR,
							},
						},
					],
				},
				{
					reply: {
						request: {
							// No id property
						},
					},
				},
			);

			// Should use "unknown" as correlationId
			expect(result.response.errors?.[0]?.extensions?.correlationId).toBe(
				"unknown",
			);
		});

		it("should handle error with valid ErrorCode but no httpStatus mapping", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message?: string;
							extensions?: { code?: string; details?: unknown };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: {
						errors?: Array<{ extensions?: { httpStatus?: number } }>;
					};
				};
			};

			// Test with error that has valid ErrorCode but no httpStatus mapping (fallback to 500)
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							// No message - should use fallback
							extensions: {
								code: ErrorCode.INTERNAL_SERVER_ERROR, // Valid ErrorCode but maps to 500 by default
								details: { test: "value" },
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use 500 as httpStatus (default fallback)
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(500);
		});

		it("should handle context with non-object type", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: unknown,
				) => {
					statusCode: number;
					response: {
						errors?: Array<{ extensions?: { correlationId?: string } }>;
					};
				};
			};

			// Test with context that is not an object
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Test error",
							extensions: {
								code: ErrorCode.INTERNAL_SERVER_ERROR,
							},
						},
					],
				},
				"not-an-object", // Non-object context
			);

			// Should use "unknown" as correlationId
			expect(result.response.errors?.[0]?.extensions?.correlationId).toBe(
				"unknown",
			);
		});

		it("should handle error with extensions.code that exists but is not in ErrorCode enum", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: { errors?: Array<{ extensions?: { code?: string } }> };
				};
			};

			// Test with error that has extensions.code but it's not a valid ErrorCode enum value
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Test error",
							extensions: {
								code: "NOT_A_VALID_ERROR_CODE", // Not in ErrorCode enum
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalizeError and get INTERNAL_SERVER_ERROR
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});

		it("should handle formattedErrors with undefined httpStatus", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { code?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => { statusCode: number };
			};

			// Test with error that results in formattedError with undefined httpStatus
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Test error",
							extensions: {
								code: "CUSTOM_CODE_NO_STATUS", // Will go through normalizeError path
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should fallback to 500 when httpStatus is undefined
			expect(result.statusCode).toBe(500);
		});

		it("should handle error with extensions but no code property", async () => {
			const mockFastifyInstance = {
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
							hello: { type: GraphQLString, resolve: () => "Hello" },
						},
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Find the mercurius registration call
			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"errorFormatter" in call[1],
			);

			const mercuriusConfig = mercuriusCall?.[1] as {
				errorFormatter: (
					execution: {
						errors: Array<{
							message: string;
							extensions?: { someOtherField?: string };
						}>;
					},
					context: {
						reply?: {
							request?: {
								id?: string;
								log?: { error: (obj: unknown) => void };
							};
						};
					},
				) => {
					statusCode: number;
					response: { errors?: Array<{ extensions?: { code?: string } }> };
				};
			};

			// Test with error that has extensions but no code property
			const result = mercuriusConfig.errorFormatter(
				{
					errors: [
						{
							message: "Test error",
							extensions: {
								someOtherField: "value", // Has extensions but no code
							},
						},
					],
				},
				{
					reply: {
						request: {
							id: "test-req",
							log: { error: vi.fn() },
						},
					},
				},
			);

			// Should use normalizeError path
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});
	});

	describe("getPublicErrorMessage", () => {
		it("should return default message when error has no message", () => {
			expect(getPublicErrorMessage({}, "default")).toBe("default");
			expect(getPublicErrorMessage({ message: undefined }, "fallback")).toBe(
				"fallback",
			);
		});

		it("should return allowlisted messages as-is", () => {
			expect(
				getPublicErrorMessage({ message: "Minio removal error" }, "default"),
			).toBe("Minio removal error");
			expect(
				getPublicErrorMessage({ message: "Invalid UUID" }, "default"),
			).toBe("Invalid UUID");
			expect(
				getPublicErrorMessage({ message: "database_error" }, "default"),
			).toBe("database_error");
			expect(
				getPublicErrorMessage(
					{ message: "An error occurred while fetching users" },
					"default",
				),
			).toBe("An error occurred while fetching users");
			expect(
				getPublicErrorMessage(
					{ message: "An error occurred while fetching events" },
					"default",
				),
			).toBe("An error occurred while fetching events");
		});

		it("should return allowlisted messages with trailing period stripped", () => {
			expect(
				getPublicErrorMessage({ message: "Invalid UUID." }, "default"),
			).toBe("Invalid UUID");
			expect(
				getPublicErrorMessage({ message: "database_error." }, "default"),
			).toBe("database_error");
		});

		it("should mask sensitive messages starting with Database", () => {
			expect(
				getPublicErrorMessage(
					{ message: "Database connection failed" },
					"safe",
				),
			).toBe("safe");
		});

		it("should mask sensitive messages containing query:", () => {
			expect(
				getPublicErrorMessage(
					{ message: "Failed at query: SELECT * FROM users" },
					"safe",
				),
			).toBe("safe");
		});

		it("should mask sensitive messages containing boom", () => {
			expect(
				getPublicErrorMessage({ message: "Something went boom" }, "safe"),
			).toBe("safe");
		});

		it("should return default message for unknown messages", () => {
			expect(
				getPublicErrorMessage({ message: "some random error" }, "default"),
			).toBe("default");
		});
	});

	describe("extractZodMessage", () => {
		it("should handle string normalizedDetails by JSON-parsing them", () => {
			const details = JSON.stringify({
				properties: {
					id: { errors: ["Invalid UUID"] },
				},
			});
			expect(extractZodMessage(details, {}, "fallback")).toBe("Invalid uuid");
		});

		it("should handle treeified Zod error format with Invalid UUID", () => {
			const details = {
				properties: {
					id: { errors: ["Invalid UUID"] },
				},
			};
			expect(extractZodMessage(details, {}, "fallback")).toBe("Invalid uuid");
		});

		it("should handle treeified Zod error format without Invalid UUID", () => {
			const details = {
				properties: {
					id: { errors: ["some other error"] },
				},
			};
			// Doesn't match "Invalid UUID" → falls through to fallback
			expect(extractZodMessage(details, {}, "fallback")).toBe("fallback");
		});

		it("should handle treeified format without id property", () => {
			const details = {
				properties: {
					name: { errors: ["Required"] },
				},
			};
			expect(extractZodMessage(details, {}, "fallback")).toBe("fallback");
		});

		it("should handle array format with Invalid UUID message", () => {
			const details = [{ message: "Invalid UUID" }];
			expect(extractZodMessage(details, {}, "fallback")).toBe("Invalid uuid");
		});

		it("should handle array format with lowercase Invalid uuid message", () => {
			const details = [{ message: "Invalid uuid" }];
			expect(extractZodMessage(details, {}, "fallback")).toBe("Invalid uuid");
		});

		it("should handle array format with non-UUID message", () => {
			const details = [{ message: "Field is required" }];
			expect(extractZodMessage(details, {}, "fallback")).toBe(
				"Field is required",
			);
		});

		it("should handle array format with empty first error object", () => {
			const details = [{ notMessage: "something" }];
			// firstError has no 'message' key → falls through
			expect(extractZodMessage(details, {}, "fallback")).toBe("fallback");
		});

		it("should handle empty array details", () => {
			expect(extractZodMessage([], {}, "fallback")).toBe("fallback");
		});

		it("should return Invalid uuid when error.message includes Invalid UUID", () => {
			const error = { message: "Zod: Invalid UUID provided" };
			expect(extractZodMessage(null, error, "fallback")).toBe("Invalid uuid");
		});

		it("should return Invalid uuid when originalError.message includes Invalid UUID", () => {
			const error = {
				message: "Something",
				originalError: { message: "Invalid UUID" },
			};
			expect(extractZodMessage(null, error, "fallback")).toBe("Invalid uuid");
		});

		it("should handle JSON parse error in string details gracefully", () => {
			// Invalid JSON string should trigger catch block
			expect(extractZodMessage("{invalid-json", {}, "fallback")).toBe(
				"fallback",
			);
		});

		it("should use getPublicErrorMessage as final fallback", () => {
			const error = { message: "Invalid UUID" };
			// null details → skip try block → check error.message → includes Invalid UUID
			expect(extractZodMessage(null, error, "fallback")).toBe("Invalid uuid");
		});

		it("should fall through to getPublicErrorMessage for non-matching errors", () => {
			const error = { message: "some random error" };
			expect(extractZodMessage(null, error, "fallback")).toBe("fallback");
		});

		it("should handle falsy error message and originalError message", () => {
			expect(extractZodMessage(null, {}, "fallback")).toBe("fallback");
			expect(
				extractZodMessage(null, { message: "", originalError: {} }, "fallback"),
			).toBe("fallback");
		});
	});

	describe("createContext - Auth logging fallbacks", () => {
		it("should silently skip logging when debug is not available for header auth failure", async () => {
			const infoSpy = vi.fn();
			const warnSpy = vi.fn();
			const errorSpy = vi.fn();
			const mockReq: Partial<FastifyRequest> = {
				jwtVerify: vi.fn().mockRejectedValue(new Error("No header")),
				ip: "127.0.0.1",
				cookies: {},
				log: {
					info: infoSpy,
					warn: warnSpy,
					error: errorSpy,
					child: vi.fn().mockReturnThis(),
					level: "info",
					fatal: vi.fn(),
					trace: vi.fn(),
					silent: vi.fn(),
				} as unknown as FastifyRequest["log"],
			};

			const mockFastifyLocal: Partial<FastifyInstance> = {
				drizzleClient: {} as FastifyInstance["drizzleClient"],
				cache: {} as unknown as FastifyInstance["cache"],
				envConfig: {
					API_JWT_EXPIRES_IN: 900000,
				} as FastifyInstance["envConfig"],
				jwt: { sign: vi.fn() } as unknown as FastifyInstance["jwt"],
				log: mockReq.log as unknown as FastifyInstance["log"],
				minio: {} as FastifyInstance["minio"],
			};

			const context = await createContext({
				fastify: mockFastifyLocal as FastifyInstance,
				request: mockReq as FastifyRequest,
				isSubscription: false,
				reply: { setCookie: vi.fn() } as unknown as FastifyReply,
			});

			expect(context.currentClient.isAuthenticated).toBe(false);
			// With optional chaining, no fallback to info/warn/error occurs
			expect(infoSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("should silently skip logging when debug is not available for cookie auth failure", async () => {
			const infoSpy = vi.fn();
			const warnSpy = vi.fn();
			const errorSpy = vi.fn();
			const mockReq: Partial<FastifyRequest> = {
				jwtVerify: vi.fn().mockRejectedValue(new Error("No header")),
				ip: "127.0.0.1",
				cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "bad-cookie" },
				log: {
					info: infoSpy,
					warn: warnSpy,
					error: errorSpy,
					child: vi.fn().mockReturnThis(),
					level: "info",
					fatal: vi.fn(),
					trace: vi.fn(),
					silent: vi.fn(),
				} as unknown as FastifyRequest["log"],
			};

			const mockFastifyLocal: Partial<FastifyInstance> = {
				drizzleClient: {} as FastifyInstance["drizzleClient"],
				cache: {} as unknown as FastifyInstance["cache"],
				envConfig: {
					API_JWT_EXPIRES_IN: 900000,
				} as FastifyInstance["envConfig"],
				jwt: {
					sign: vi.fn(),
					verify: vi.fn().mockRejectedValue(new Error("Bad cookie")),
				} as unknown as FastifyInstance["jwt"],
				log: mockReq.log as unknown as FastifyInstance["log"],
				minio: {} as FastifyInstance["minio"],
			};

			const context = await createContext({
				fastify: mockFastifyLocal as FastifyInstance,
				request: mockReq as FastifyRequest,
				isSubscription: false,
				reply: { setCookie: vi.fn() } as unknown as FastifyReply,
			});

			expect(context.currentClient.isAuthenticated).toBe(false);
			// With optional chaining, no fallback to info/warn/error occurs
			expect(infoSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("should handle no logging methods at all for header auth failure", async () => {
			const mockReq: Partial<FastifyRequest> = {
				jwtVerify: vi.fn().mockRejectedValue(new Error("No header")),
				ip: "127.0.0.1",
				cookies: {},
				log: {
					child: vi.fn().mockReturnThis(),
					level: "silent",
					fatal: vi.fn(),
					trace: vi.fn(),
					silent: vi.fn(),
				} as unknown as FastifyRequest["log"],
			};

			const mockFastifyLocal: Partial<FastifyInstance> = {
				drizzleClient: {} as FastifyInstance["drizzleClient"],
				cache: {} as unknown as FastifyInstance["cache"],
				envConfig: {
					API_JWT_EXPIRES_IN: 900000,
				} as FastifyInstance["envConfig"],
				jwt: { sign: vi.fn() } as unknown as FastifyInstance["jwt"],
				log: mockReq.log as unknown as FastifyInstance["log"],
				minio: {} as FastifyInstance["minio"],
			};

			const context = await createContext({
				fastify: mockFastifyLocal as FastifyInstance,
				request: mockReq as FastifyRequest,
				isSubscription: false,
				reply: { setCookie: vi.fn() } as unknown as FastifyReply,
			});

			expect(context.currentClient.isAuthenticated).toBe(false);
		});
	});

	describe("preExecution Hook - Auth logging fallbacks", () => {
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
		let preExecutionHook: (
			schema: GraphQLSchema,
			context: { definitions: Array<{ kind: string; operation?: string }> },
			document: {
				__currentQuery: Record<string, unknown>;
				reply: {
					request: {
						ip?: string;
						jwtVerify: ReturnType<typeof vi.fn>;
						log?: unknown;
					};
				};
			},
			variables: Record<string, unknown>,
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
						hello: { type: GraphQLString, resolve: () => "Hello" },
					},
				}),
			});

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(mockSchema);
			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(() => {});
			vi.mocked(complexityFromQuery).mockReturnValue({
				complexity: 5,
				breadth: 1,
				depth: 1,
			});
			vi.mocked(complexityLeakyBucket).mockResolvedValue(true);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const addHookCall = mockFastifyInstance.graphql.addHook.mock.calls.find(
				(call: unknown[]) => call?.[0] === "preExecution",
			);
			preExecutionHook = addHookCall?.[1] as typeof preExecutionHook;
		});

		it("should use debug logger when available during preExecution JWT failure", async () => {
			const debugSpy = vi.fn();
			const mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn().mockRejectedValue(new Error("fail")),
						log: {
							debug: debugSpy,
							info: vi.fn(),
							warn: vi.fn(),
							error: vi.fn(),
						},
					},
				},
			};

			await preExecutionHook(
				mockSchema,
				{ definitions: [{ kind: "OperationDefinition", operation: "query" }] },
				mockDocument,
				{},
			);

			expect(debugSpy).toHaveBeenCalledWith(
				expect.objectContaining({ err: expect.any(Error) }),
				"JWT verification failed during preExecution; using unauthenticated rate limits",
			);
		});

		it("should silently skip logging when debug is not available during preExecution JWT failure", async () => {
			const infoSpy = vi.fn();
			const warnSpy = vi.fn();
			const errorSpy = vi.fn();
			const mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn().mockRejectedValue(new Error("fail")),
						log: { info: infoSpy, warn: warnSpy, error: errorSpy },
					},
				},
			};

			await preExecutionHook(
				mockSchema,
				{ definitions: [{ kind: "OperationDefinition", operation: "query" }] },
				mockDocument,
				{},
			);

			// With optional chaining, no fallback to info/warn/error occurs
			expect(infoSpy).not.toHaveBeenCalled();
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("should silently skip logging when only warn and error are available during preExecution JWT failure", async () => {
			const warnSpy = vi.fn();
			const errorSpy = vi.fn();
			const mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn().mockRejectedValue(new Error("fail")),
						log: { warn: warnSpy, error: errorSpy },
					},
				},
			};

			await preExecutionHook(
				mockSchema,
				{ definitions: [{ kind: "OperationDefinition", operation: "query" }] },
				mockDocument,
				{},
			);

			// With optional chaining, no fallback to warn/error occurs
			expect(warnSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("should silently skip logging when only error is available during preExecution JWT failure", async () => {
			const errorSpy = vi.fn();
			const mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn().mockRejectedValue(new Error("fail")),
						log: { error: errorSpy },
					},
				},
			};

			await preExecutionHook(
				mockSchema,
				{ definitions: [{ kind: "OperationDefinition", operation: "query" }] },
				mockDocument,
				{},
			);

			// With optional chaining, no fallback to error occurs
			expect(errorSpy).not.toHaveBeenCalled();
		});

		it("should handle no logging methods during preExecution JWT failure", async () => {
			const mockDocument = {
				__currentQuery: {},
				reply: {
					request: {
						ip: "192.168.1.1",
						jwtVerify: vi.fn().mockRejectedValue(new Error("fail")),
						log: {},
					},
				},
			};

			await expect(
				preExecutionHook(
					mockSchema,
					{
						definitions: [{ kind: "OperationDefinition", operation: "query" }],
					},
					mockDocument,
					{},
				),
			).resolves.not.toThrow();
		});
	});

	describe("Error Formatter - Additional branch coverage", () => {
		let errorFormatter: (
			execution: { data?: unknown; errors: unknown[] },
			context: unknown,
		) => {
			statusCode: number;
			response: {
				data: unknown;
				errors?: Array<{
					message: string;
					extensions?: Record<string, unknown>;
				}>;
			};
		};

		beforeEach(async () => {
			const mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
					API_GRAPHQL_MUTATION_BASE_COST: 10,
					API_RATE_LIMIT_BUCKET_CAPACITY: 100,
					API_RATE_LIMIT_REFILL_RATE: 1,
				},
				log: { info: vi.fn(), error: vi.fn() },
				graphql: { replaceSchema: vi.fn(), addHook: vi.fn() },
			};

			vi.mocked(schemaManager.buildInitialSchema).mockResolvedValue(
				new GraphQLSchema({
					query: new GraphQLObjectType({
						name: "Query",
						fields: { hello: { type: GraphQLString } },
					}),
				}),
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			const mercuriusCall = mockFastifyInstance.register.mock.calls.find(
				(call: unknown[]) =>
					call?.[1] &&
					typeof call[1] === "object" &&
					"schema" in (call[1] as Record<string, unknown>),
			);
			errorFormatter = (
				mercuriusCall?.[1] as { errorFormatter: typeof errorFormatter }
			).errorFormatter;
		});

		it("should handle TalawaGraphQLError with empty/falsy message", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "",
							extensions: { code: ErrorCode.INTERNAL_SERVER_ERROR },
						}),
					],
				},
				{ reply: { request: { id: "req-1", log: { error: vi.fn() } } } },
			);

			// Empty message should fall back to "An error occurred"
			expect(result.response.errors?.[0]?.message).toBe("An error occurred");
		});

		it("should handle MER_ERR_GQL_VALIDATION error code from originalError", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Mercurius validation error",
							locations: [{ line: 1, column: 1 }],
							path: ["test"],
							extensions: { someField: "value" },
							originalError: { code: "MER_ERR_GQL_VALIDATION" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							toJSON: () => ({ message: "Mercurius validation error" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-mer", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(400);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(400);
		});

		it("should handle validation error with falsy message", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "",
							extensions: { code: "GRAPHQL_VALIDATION_FAILED" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-empty", log: { error: vi.fn() } } } },
			);

			// Empty message should fall back to "GraphQL validation error"
			expect(result.response.errors?.[0]?.message).toBe(
				"GraphQL validation error",
			);
		});

		it("should handle valid ErrorCode with all message sources empty", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "",
							extensions: {
								code: ErrorCode.NOT_FOUND,
								message: "",
							},
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-nomsg", log: { error: vi.fn() } } } },
			);

			// All sources empty → normalizeError returns "Internal Server Error"
			expect(result.response.errors?.[0]?.message).toBe(
				"Internal Server Error",
			);
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.NOT_FOUND,
			);
		});

		it("should handle error with extensions containing Invalid UUID in message", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Invalid UUID provided",
							extensions: {
								code: "SOME_INVALID_CODE",
							},
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "Invalid UUID provided" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-uuid", log: { error: vi.fn() } } } },
			);

			// normalizeError returns INTERNAL_SERVER_ERROR and message includes "Invalid UUID"
			expect(result.response.errors?.[0]?.message).toBe("Invalid uuid");
		});

		it("should handle error with extensions and INVALID_ARGUMENTS code plus Zod details", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Validation error",
							extensions: {
								code: "SOME_INVALID_CODE",
							},
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "Validation error" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-zod", log: { error: vi.fn() } } } },
			);

			// Goes through normalizeError path → extensions with invalid code
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});

		it("should handle error with extensions and normalized details for Zod extraction", async () => {
			// This specifically tests the branch:
			// if ((normalized.code === INTERNAL_SERVER_ERROR || INVALID_ARGUMENTS) && normalized.details)
			// We need a ZodError or an error that normalizeError returns with details
			const { ZodError: ZodErrorClass } = await import("zod");
			const zodError = new ZodErrorClass([
				{
					code: "invalid_format",
					format: "uuid",
					message: "Invalid UUID",
					path: ["id"],
				},
			]);
			// Wrap the ZodError in an object with extensions (invalid code) so it takes the
			// "extensions but invalid code" path, and normalizeError recognizes it as ZodError
			const wrappedError = Object.assign(zodError, {
				extensions: { code: "WRONG_CODE" },
				name: "ZodError",
				nodes: undefined,
				source: undefined,
				positions: undefined,
				originalError: undefined,
				locations: undefined,
				path: undefined,
				toJSON: () => ({ message: zodError.message }),
				[Symbol.toStringTag]: "GraphQLError",
			});

			const result = errorFormatter(
				{ data: null, errors: [wrappedError] },
				{ reply: { request: { id: "req-zod2", log: { error: vi.fn() } } } },
			);

			// normalizeError detects ZodError → code=INVALID_ARGUMENTS, details present
			// extractZodMessage extracts the "Invalid uuid" message
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
			expect(result.response.errors?.[0]?.message).toBe("Invalid uuid");
		});

		it("should handle error without extensions with normalized INVALID_ARGUMENTS code and Zod details", async () => {
			// Create a ZodError without extensions to hit the !error.extensions path
			const { ZodError: ZodErrorClass } = await import("zod");
			const zodError = new ZodErrorClass([
				{
					code: "invalid_format",
					format: "uuid",
					message: "Invalid UUID",
					path: ["id"],
				},
			]);
			// Remove extensions to trigger the !error.extensions branch
			const errorWithNoExtensions = Object.assign(zodError, {
				name: "ZodError",
				nodes: undefined,
				source: undefined,
				positions: undefined,
				originalError: undefined,
				locations: undefined,
				path: undefined,
				toJSON: () => ({ message: zodError.message }),
				[Symbol.toStringTag]: "GraphQLError",
			});

			const result = errorFormatter(
				{ data: null, errors: [errorWithNoExtensions] },
				{ reply: { request: { id: "req-noe", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
			expect(result.response.errors?.[0]?.message).toBe("Invalid uuid");
		});

		it("should handle error without extensions using getPublicErrorMessage for non-Zod errors", () => {
			const plainError = {
				message: "Minio removal error",
				name: "Error",
				nodes: undefined,
				source: undefined,
				positions: undefined,
				originalError: undefined,
				locations: undefined,
				path: undefined,
				toJSON: () => ({ message: "Minio removal error" }),
				[Symbol.toStringTag]: "GraphQLError",
			};

			const result = errorFormatter(
				{ data: null, errors: [plainError] },
				{ reply: { request: { id: "req-pub", log: { error: vi.fn() } } } },
			);

			// getPublicErrorMessage returns "Minio removal error" since it's in allowlist
			expect(result.response.errors?.[0]?.message).toBe("Minio removal error");
		});

		it("should handle error without extensions with falsy normalized message", () => {
			const errorNoMsg = {
				message: "",
				name: "Error",
				nodes: undefined,
				source: undefined,
				positions: undefined,
				originalError: undefined,
				locations: undefined,
				path: undefined,
				toJSON: () => ({ message: "" }),
				[Symbol.toStringTag]: "GraphQLError",
			};

			const result = errorFormatter(
				{ data: null, errors: [errorNoMsg] },
				{ reply: { request: { id: "req-nmsg", log: { error: vi.fn() } } } },
			);

			// normalized.message is "Internal Server Error", which getPublicErrorMessage maps to default
			expect(result.response.errors?.[0]?.message).toBeDefined();
			expect(result.response.errors?.[0]?.message.length).toBeGreaterThan(0);
		});

		it("should handle normalized.code falsy fallback to INTERNAL_SERVER_ERROR", () => {
			// Ensure error without extensions gets INTERNAL_SERVER_ERROR as fallback
			const nullishError = {
				message: "some error",
				name: "Error",
				nodes: undefined,
				source: undefined,
				positions: undefined,
				originalError: undefined,
				locations: undefined,
				path: undefined,
				toJSON: () => ({ message: "some error" }),
				[Symbol.toStringTag]: "GraphQLError",
			};

			const result = errorFormatter(
				{ data: null, errors: [nullishError] },
				{ reply: { request: { id: "req-ncode", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
			expect(result.response.errors?.[0]?.extensions?.httpStatus).toBe(500);
		});

		it("should handle error with extensions INTERNAL_SERVER_ERROR + details for Zod extraction", () => {
			// This tests the branch in the "extensions but invalid codes" path:
			// if (normalized.code === INTERNAL_SERVER_ERROR && normalized.details)
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Something failed",
							extensions: {
								code: "UNKNOWN_CODE",
							},
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "Something failed" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-ise", log: { error: vi.fn() } } } },
			);

			// normalizeError returns INTERNAL_SERVER_ERROR with details (in non-production)
			// Then extractZodMessage is called OR getPublicErrorMessage is called
			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});

		it("should handle error with extensions and falsy normalized.message", () => {
			// Tests the String(normalized.message || "An error occurred") branch when
			// normalized.message is empty
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "",
							extensions: {
								code: "UNKNOWN_CODE",
							},
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-fm", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.message).toBeDefined();
			expect(result.response.errors?.[0]?.message.length).toBeGreaterThan(0);
		});

		it("should handle 'graphql validation error' message (lowercase)", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "graphql validation error",
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "graphql validation error" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-gql", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
			expect(result.statusCode).toBe(400);
		});

		it("should handle 'Cannot query field' message as validation error", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: 'Cannot query field "xyz" on type "Query"',
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: 'Cannot query field "xyz"' }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-cqf", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should handle 'Unknown field' message as validation error", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Unknown field 'test'",
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "Unknown field 'test'" }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-uf", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should handle 'Must provide query string.' message as validation error", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: "Must provide query string.",
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: "Must provide query string." }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-mpq", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should handle 'Unknown argument' message as validation error", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: 'Unknown argument "bad" on field "Query.hello"',
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: 'Unknown argument "bad"' }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-ua", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it('should handle Variable "$..." message as validation error', () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						{
							message: 'Variable "$input" is not defined',
							extensions: { someField: "value" },
							name: "GraphQLError",
							nodes: undefined,
							source: undefined,
							positions: undefined,
							originalError: undefined,
							locations: undefined,
							path: undefined,
							toJSON: () => ({ message: 'Variable "$input" is not defined' }),
							[Symbol.toStringTag]: "GraphQLError",
						},
					],
				},
				{ reply: { request: { id: "req-var", log: { error: vi.fn() } } } },
			);

			expect(result.response.errors?.[0]?.extensions?.code).toBe(
				ErrorCode.INVALID_ARGUMENTS,
			);
		});

		it("should handle context with log but no reply for error logging", () => {
			const logErrorSpy = vi.fn();
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
				{ log: { error: logErrorSpy } },
			);

			expect(logErrorSpy).toHaveBeenCalledWith(
				expect.objectContaining({ msg: "GraphQL error" }),
			);
			expect(result.statusCode).toBe(500);
		});

		it("should handle context without any logger", () => {
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
				{ reply: { request: {} } },
			);

			expect(result.statusCode).toBe(500);
		});

		it("should handle NOT_FOUND status code mapping", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Resource not found",
							extensions: { code: ErrorCode.NOT_FOUND },
						}),
					],
				},
				{ reply: { request: { id: "req-nf", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(404);
		});

		it("should handle ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND status code mapping", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Associated resource not found",
							extensions: {
								code: ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
							},
						}),
					],
				},
				{ reply: { request: { id: "req-aarnf", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(404);
		});

		it("should handle TOKEN_EXPIRED status code mapping to 401", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Token expired",
							extensions: { code: ErrorCode.TOKEN_EXPIRED },
						}),
					],
				},
				{ reply: { request: { id: "req-te", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(401);
		});

		it("should handle INVALID_INPUT status code mapping to 400", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Invalid input",
							extensions: { code: ErrorCode.INVALID_INPUT },
						}),
					],
				},
				{ reply: { request: { id: "req-ii", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(400);
		});

		it("should handle FORBIDDEN_ACTION status code mapping to 403", () => {
			const result = errorFormatter(
				{
					data: null,
					errors: [
						new TalawaGraphQLError({
							message: "Forbidden action",
							extensions: { code: ErrorCode.FORBIDDEN_ACTION },
						}),
					],
				},
				{ reply: { request: { id: "req-fa", log: { error: vi.fn() } } } },
			);

			expect(result.statusCode).toBe(403);
		});
	});
});
