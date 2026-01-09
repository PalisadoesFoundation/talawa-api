import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExplicitAuthenticationTokenPayload } from "~/src/graphql/context";
import { createContext } from "~/src/routes/graphql";
import {
	createPerformanceTracker,
	type PerformanceTracker,
} from "~/src/utilities/metrics/performanceTracker";
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
			cookies: {},
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

		it("should use fastify.drizzleClient and fastify.cache for subscriptions (not request wrapped clients)", async () => {
			// Create wrapped clients on request to simulate performance plugin
			const wrappedDrizzleClient = {
				_wrapped: true,
				query: mockFastify.drizzleClient?.query,
			};
			const wrappedCache = {
				_wrapped: true,
				get: vi.fn(),
				set: vi.fn(),
			};

			mockRequest.drizzleClient =
				wrappedDrizzleClient as unknown as FastifyInstance["drizzleClient"];
			mockRequest.cache = wrappedCache as unknown as FastifyInstance["cache"];
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No token"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: true,
				socket: mockSocket as WebSocket,
			});

			// Subscriptions should use original fastify clients, not wrapped request clients
			expect(context.drizzleClient).toBe(mockFastify.drizzleClient);
			expect(context.drizzleClient).not.toBe(wrappedDrizzleClient);
			expect(context.cache).toBe(mockFastify.cache);
			expect(context.cache).not.toBe(wrappedCache);
		});

		it("should use request.drizzleClient and request.cache for HTTP requests when available", async () => {
			// Create wrapped clients on request to simulate performance plugin
			const wrappedDrizzleClient = {
				_wrapped: true,
				query: mockFastify.drizzleClient?.query,
			};
			const wrappedCache = {
				_wrapped: true,
				get: vi.fn(),
				set: vi.fn(),
			};

			mockRequest.drizzleClient =
				wrappedDrizzleClient as unknown as FastifyInstance["drizzleClient"];
			mockRequest.cache = wrappedCache as unknown as FastifyInstance["cache"];
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No token"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			// HTTP requests should use wrapped request clients for performance tracking
			expect(context.drizzleClient).toBe(wrappedDrizzleClient);
			expect(context.drizzleClient).not.toBe(mockFastify.drizzleClient);
			expect(context.cache).toBe(wrappedCache);
			expect(context.cache).not.toBe(mockFastify.cache);
		});

		it("should fall back to fastify.drizzleClient and fastify.cache when request clients are not available", async () => {
			// Don't set request.drizzleClient or request.cache
			mockRequest.drizzleClient = undefined;
			mockRequest.cache = undefined;
			mockRequest.jwtVerify = vi.fn().mockRejectedValue(new Error("No token"));

			const context = await createContext({
				fastify: mockFastify as FastifyInstance,
				request: mockRequest as FastifyRequest,
				isSubscription: false,
				reply: mockReply as FastifyReply,
			});

			// Should fall back to fastify clients
			expect(context.drizzleClient).toBe(mockFastify.drizzleClient);
			expect(context.cache).toBe(mockFastify.cache);
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
			it("should include perf in context when request.perf is available", async () => {
				const mockPerf = createPerformanceTracker();
				mockRequest.perf = mockPerf;
				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				expect(context.perf).toBe(mockPerf);
				expect(context.perf).toBeDefined();
			});

			it("should set perf to undefined when request.perf is not available", async () => {
				mockRequest.perf = undefined;
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
			});

			it("should allow resolvers to use context.perf to track operations", async () => {
				const mockPerf = createPerformanceTracker();
				mockRequest.perf = mockPerf;
				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				// Simulate resolver using perf tracker
				await context.perf?.time("customOperation", async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return "result";
				});

				const snapshot = context.perf?.snapshot();
				expect(snapshot?.ops.customOperation).toBeDefined();
				expect(snapshot?.ops.customOperation?.count).toBe(1);
			});

			it("should allow resolvers to track cache hits and misses", async () => {
				const mockPerf = createPerformanceTracker();
				mockRequest.perf = mockPerf;
				mockRequest.jwtVerify = vi
					.fn()
					.mockRejectedValue(new Error("No token"));

				const context = await createContext({
					fastify: mockFastify as FastifyInstance,
					request: mockRequest as FastifyRequest,
					isSubscription: false,
					reply: mockReply as FastifyReply,
				});

				// Simulate cache operations
				context.perf?.trackCacheHit();
				context.perf?.trackCacheHit();
				context.perf?.trackCacheMiss();

				const snapshot = context.perf?.snapshot();
				expect(snapshot?.cacheHits).toBe(2);
				expect(snapshot?.cacheMisses).toBe(1);
				expect(snapshot?.hitRate).toBeCloseTo(2 / 3, 2);
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
					perf?: PerformanceTracker;
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
						perf: undefined,
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
				15,
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

			vi.mocked(TalawaGraphQLError).mockImplementation(
				(config: { message?: string; extensions?: unknown }) => {
					const error = new Error(config.message);
					(error as Error & { extensions?: unknown }).extensions =
						config.extensions;
					return error as TalawaGraphQLError;
				},
			);

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

			vi.mocked(TalawaGraphQLError).mockImplementation(
				(config: { message?: string; extensions?: unknown }) => {
					const error = new Error("Rate limit exceeded");
					(error as Error & { extensions?: unknown }).extensions =
						config.extensions;
					return error as TalawaGraphQLError;
				},
			);

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

		it("should track complexity score in performance tracker", async () => {
			const mockComplexity = { complexity: 15, breadth: 2, depth: 3 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const mockPerf = createPerformanceTracker();
			mockDocument.reply.request.perf = mockPerf;
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

			const snapshot = mockPerf.snapshot();
			expect(snapshot.complexityScore).toBe(15);
		});

		it("should track complexity score with mutation base cost", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			const mockPerf = createPerformanceTracker();
			mockDocument.reply.request.perf = mockPerf;
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

			const snapshot = mockPerf.snapshot();
			// Should track complexity with mutation base cost (5 + 10 = 15)
			expect(snapshot.complexityScore).toBe(15);
		});

		it("should not fail when perf is not available in preExecution", async () => {
			const mockComplexity = { complexity: 5, breadth: 1, depth: 1 };
			vi.mocked(complexityFromQuery).mockReturnValue(mockComplexity);

			mockDocument.reply.request.perf = undefined;
			mockDocument.reply.request.jwtVerify.mockRejectedValue(
				new Error("No token"),
			);
			vi.mocked(leakyBucket).mockResolvedValue(true);

			// Should not throw when perf is undefined
			await expect(
				preExecutionHook(mockSchema, mockContext, mockDocument, mockVariables),
			).resolves.not.toThrow();
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
			cache: FastifyInstance["cache"];
			drizzleClient: FastifyInstance["drizzleClient"];
			minio: FastifyInstance["minio"];
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
				cache: {} as FastifyInstance["cache"],
				drizzleClient: {} as FastifyInstance["drizzleClient"],
				minio: {} as FastifyInstance["minio"],
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

		it("should extract perf from socket.request.perf for subscriptions", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const mockPerf = createPerformanceTracker();
			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			const result = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: mockPerf,
					},
				},
			})) as { perf?: unknown };

			expect(result).not.toBe(false);
			expect(result.perf).toBe(mockPerf);
		});

		it("should set perf to undefined when socket.request.perf is not available", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			const result = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {},
				},
			})) as { perf?: unknown };

			expect(result).not.toBe(false);
			expect(result.perf).toBeUndefined();
		});

		it("should handle invalid perf object in subscription with type guard", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			// Pass an invalid perf object (missing required methods)
			const result = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: { someInvalidProperty: true },
					},
				},
			})) as { perf?: unknown };

			expect(result).not.toBe(false);
			// Type guard should reject invalid perf object
			expect(result.perf).toBeUndefined();
		});

		it("should handle null perf in subscription", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			const result = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: null,
					},
				},
			})) as { perf?: unknown };

			expect(result).not.toBe(false);
			expect(result.perf).toBeUndefined();
		});

		it("should handle non-object perf in subscription", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			// Test with string (not an object)
			const result1 = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: "not-an-object",
					},
				},
			})) as { perf?: unknown };

			expect(result1).not.toBe(false);
			expect(result1.perf).toBeUndefined();

			// Test with number (not an object)
			const result2 = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: 123,
					},
				},
			})) as { perf?: unknown };

			expect(result2).not.toBe(false);
			expect(result2.perf).toBeUndefined();
		});

		it("should handle perf object with missing methods in subscription", async () => {
			const { graphql } = await import("~/src/routes/graphql");

			const decoded = {
				user: { id: "user-789" },
			} as ExplicitAuthenticationTokenPayload;

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

			// Test with object that has snapshot but not trackComplexity
			const result1 = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: {
							snapshot: vi.fn(),
						},
					},
				},
			})) as { perf?: unknown };

			expect(result1).not.toBe(false);
			expect(result1.perf).toBeUndefined();

			// Test with object that has both properties but they're not functions
			const result2 = (await subscriptionConfig.subscription.onConnect({
				payload: { authorization: "Bearer valid-token" },
				socket: {
					request: {
						perf: {
							snapshot: "not-a-function",
							trackComplexity: "not-a-function",
						},
					},
				},
			})) as { perf?: unknown };

			expect(result2).not.toBe(false);
			expect(result2.perf).toBeUndefined();
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				data: { user: { id: "123" } },
				errors: [
					{
						message: "Test error",
						locations: [{ line: 1, column: 5 }],
						path: ["user", "email"],
						extensions: { code: "VALIDATION_ERROR" },
					},
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
							locations: [{ line: 1, column: 5 }],
							path: ["user", "email"],
							extensions: {
								code: "VALIDATION_ERROR",
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
								correlationId: "req-456",
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
							extensions: Record<string, unknown>;
						}>;
					};
				};
			};

			const mockExecution = {
				data: null,
				errors: [
					{
						message: "Unauthorized",
						extensions: { code: "UNAUTHENTICATED" },
					},
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
								code: "UNAUTHENTICATED",
								correlationId: "multi-error-789",
							},
						},
						{
							message: "Field not found",
							locations: undefined,
							path: ["query", "nonExistent"],
							extensions: {
								code: "GRAPHQL_VALIDATION_FAILED",
								timestamp: 123456,
								correlationId: "multi-error-789",
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
						errors: Array<{
							message: string;
							locations?: Array<{ line: number; column: number }>;
							path?: Array<string | number>;
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
});
