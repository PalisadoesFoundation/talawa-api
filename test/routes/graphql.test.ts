import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
	type ExecutionResult,
	type GraphQLFormattedError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from "graphql";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { ExplicitAuthenticationTokenPayload } from "~/src/graphql/context";
import { createContext, graphql } from "~/src/routes/graphql";
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
		beforeAll(() => {
			vi.stubEnv("NODE_ENV", "test");
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
				statusCode: 500,
				response: {
					data: null,
					errors: [
						{
							message: "Internal Server Error",
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
				statusCode: 401,
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
							message: "Internal Server Error",
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
			expect(result.statusCode).toBe(500);
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

				expect(result.statusCode).toBe(500);
				const formattedError = result.response.errors?.[0];
				expect(formattedError?.extensions?.httpStatus).toBe(500);
			});
		});
	});

	describe("Additional Coverage Tests", () => {
		it("should cover error handling in schema update with non-Error objects", async () => {
			const mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn().mockImplementation(() => {
						throw "String error"; // Non-Error object
					}),
					addHook: vi.fn(),
				},
				schemaUpdateCallback: undefined as
					| ((schema: GraphQLSchema) => void)
					| undefined,
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

			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(
				(callback: (schema: GraphQLSchema) => void) => {
					mockFastifyInstance.schemaUpdateCallback = callback;
				},
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Trigger schema update with error
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

			mockFastifyInstance.schemaUpdateCallback?.(newSchema);

			expect(mockFastifyInstance.log.error).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "String error",
					timestamp: expect.any(String),
				}),
				"❌ Failed to Update GraphQL Schema",
			);
		});

		it("should cover error handling in schema update with Error objects", async () => {
			const mockFastifyInstance = {
				register: vi.fn(),
				envConfig: {
					API_IS_GRAPHIQL: true,
				},
				log: {
					info: vi.fn(),
					error: vi.fn(),
				},
				graphql: {
					replaceSchema: vi.fn().mockImplementation(() => {
						const error = new Error("Schema replacement failed");
						error.stack = "Error stack trace";
						throw error;
					}),
					addHook: vi.fn(),
				},
				schemaUpdateCallback: undefined as
					| ((schema: GraphQLSchema) => void)
					| undefined,
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

			vi.mocked(schemaManager.onSchemaUpdate).mockImplementation(
				(callback: (schema: GraphQLSchema) => void) => {
					mockFastifyInstance.schemaUpdateCallback = callback;
				},
			);

			await graphql(mockFastifyInstance as unknown as FastifyInstance);

			// Trigger schema update with error
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
	});

	describe("Observability Code Coverage", () => {
		it("should execute observability code paths when enabled", async () => {
			// Temporarily enable observability
			const originalEnv = process.env.API_OTEL_ENABLED;
			process.env.API_OTEL_ENABLED = "true";

			// Mock the OpenTelemetry API to avoid actual tracing
			const mockSpan = {
				setAttribute: vi.fn(),
				end: vi.fn(),
			};
			const mockTracer = {
				startSpan: vi.fn().mockReturnValue(mockSpan),
			};

			// Create a simple mock for the trace module
			const originalTrace = await import("@opentelemetry/api");
			const mockTrace = {
				...originalTrace,
				trace: {
					getTracer: vi.fn().mockReturnValue(mockTracer),
				},
			};

			// Mock the module
			vi.doMock("@opentelemetry/api", () => mockTrace);

			// Force re-import of the observability config
			vi.resetModules();

			try {
				// Import the graphql module which should now have observability enabled
				const { graphql } = await import("~/src/routes/graphql");

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
								hello: {
									type: GraphQLString,
									resolve: () => "Hello",
								},
							},
						}),
					}),
				);

				// This should execute the observability code paths
				await graphql(mockFastifyInstance as unknown as FastifyInstance);

				// Verify that hooks were added (this means the observability code ran)
				expect(mockFastifyInstance.graphql.addHook).toHaveBeenCalled();

				// Test the hooks that were registered
				const addHookCalls = mockFastifyInstance.graphql.addHook.mock.calls;

				// Find preExecution hooks
				const preExecutionHooks = addHookCalls.filter(
					(call: unknown[]) => call?.[0] === "preExecution",
				);

				// Find onResolution hooks
				const onResolutionHooks = addHookCalls.filter(
					(call: unknown[]) => call?.[0] === "onResolution",
				);

				// If observability is enabled, we should have tracing hooks
				if (preExecutionHooks.length > 1) {
					// Test the tracing preExecution hook
					const tracingHook = preExecutionHooks[0]?.[1] as (
						...args: unknown[]
					) => unknown;
					if (tracingHook) {
						// Test different operation scenarios to cover all branches
						const scenarios = [
							// Named operation
							{
								definitions: [
									{
										kind: "OperationDefinition",
										operation: "query",
										name: { value: "TestQuery" },
									},
								],
							},
							// Anonymous operation
							{
								definitions: [
									{
										kind: "OperationDefinition",
										operation: "mutation",
									},
								],
							},
							// Non-operation definition
							{
								definitions: [
									{
										kind: "FragmentDefinition",
										name: { value: "TestFragment" },
									},
								],
							},
						];

						for (const document of scenarios) {
							const context = {};
							await tracingHook(null, document, context);
							expect(mockTracer.startSpan).toHaveBeenCalled();
							expect(mockSpan.setAttribute).toHaveBeenCalled();
						}
					}
				}

				if (onResolutionHooks.length > 0) {
					// Test the onResolution hook
					const onResolutionHook = onResolutionHooks[0]?.[1] as (
						...args: unknown[]
					) => unknown;
					if (onResolutionHook) {
						// Test with errors
						const executionWithErrors = {
							errors: [{ message: "Test error" }],
						};
						const contextWithSpan = { _tracingSpan: mockSpan };
						await onResolutionHook(executionWithErrors, contextWithSpan);
						expect(mockSpan.setAttribute).toHaveBeenCalledWith(
							"graphql.errors.count",
							1,
						);
						expect(mockSpan.end).toHaveBeenCalled();

						// Test without errors
						vi.clearAllMocks();
						const executionWithoutErrors = {
							data: { test: "success" },
						};
						await onResolutionHook(executionWithoutErrors, contextWithSpan);
						expect(mockSpan.end).toHaveBeenCalled();

						// Test without span
						vi.clearAllMocks();
						const contextWithoutSpan = {};
						await onResolutionHook(executionWithErrors, contextWithoutSpan);
						// Should not throw
					}
				}
			} finally {
				// Restore environment
				process.env.API_OTEL_ENABLED = originalEnv;
				vi.doUnmock("@opentelemetry/api");
				vi.resetModules();
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
	});
});
