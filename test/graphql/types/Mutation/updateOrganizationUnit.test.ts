import { faker } from "@faker-js/faker";
import Fastify, { type FastifyInstance } from "fastify";
import { createMercuriusTestClient } from "mercurius-integration-testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { graphql } from "~/src/routes/graphql";
import { Mutation_updateOrganization } from "../documentNodes";

describe("Mutation updateOrganization (unit via mercurius)", () => {
	const orgId = faker.string.uuid();
	const updatedName = "Updated Org";

	const redisState = new Map<string, Record<string, string>>();
	const mockRedis = {
		hgetall: vi.fn(async (key: string) => redisState.get(key) ?? {}),
		hset: vi.fn(async (key: string, values: Record<string, string>) => {
			const existing = redisState.get(key) ?? {};
			redisState.set(key, { ...existing, ...values });
			return 1;
		}),
	};

	type MockTx = {
		update: ReturnType<typeof vi.fn>;
		set: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
	};

	const tx: MockTx = {
		update: vi.fn(),
		set: vi.fn(),
		where: vi.fn(),
		returning: vi.fn(),
	};

	const mockDrizzleClient = {
		transaction: vi.fn(),
		query: {
			usersTable: {
				findFirst: vi.fn(),
			},
			organizationsTable: {
				findFirst: vi.fn(),
			},
		},
	};

	const mockCache = {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		clearByPattern: vi.fn(),
		mget: vi.fn(),
		mset: vi.fn(),
	};

	const mockMinio = {
		client: {
			putObject: vi.fn().mockResolvedValue({}),
			removeObject: vi.fn().mockResolvedValue({}),
		},
		bucketName: "talawa",
	};

	let app: ReturnType<typeof Fastify>;
	let mercuriusClient: ReturnType<typeof createMercuriusTestClient>;

	beforeEach(async () => {
		// Reset mocks
		vi.clearAllMocks();

		// Setup default mock behaviors
		mockCache.get.mockResolvedValue(null);
		mockCache.set.mockResolvedValue(undefined);
		mockCache.del.mockResolvedValue(undefined);
		mockCache.clearByPattern.mockResolvedValue(undefined);
		mockCache.mget.mockResolvedValue([]);
		mockCache.mset.mockResolvedValue(undefined);

		tx.update.mockReturnValue(tx);
		tx.set.mockReturnValue(tx);
		tx.where.mockReturnValue(tx);
		tx.returning.mockResolvedValue([
			{
				id: orgId,
				name: updatedName,
				description: null,
				addressLine1: null,
				addressLine2: null,
				city: null,
				state: null,
				postalCode: null,
				countryCode: "us",
				userRegistrationRequired: false,
				avatarMimeType: null,
			},
		]);

		mockDrizzleClient.transaction.mockImplementation(
			(cb: (trx: MockTx) => unknown) => cb(tx),
		);

		mockDrizzleClient.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});

		// 1st call: existing org lookup; 2nd call: duplicate name check
		mockDrizzleClient.query.organizationsTable.findFirst
			.mockResolvedValueOnce({
				avatarName: null,
			})
			.mockResolvedValueOnce(undefined);

		app = Fastify({ logger: false });

		// Spy on the logger
		vi.spyOn(app.log, "error");

		app.decorate("envConfig", {
			API_IS_GRAPHIQL: true,
			API_GRAPHQL_MUTATION_BASE_COST: 1,
			API_RATE_LIMIT_BUCKET_CAPACITY: 10000,
			API_RATE_LIMIT_REFILL_RATE: 10000,
		} as unknown as FastifyInstance["envConfig"]);

		app.decorate(
			"drizzleClient",
			mockDrizzleClient as unknown as FastifyInstance["drizzleClient"],
		);

		app.decorate("cache", mockCache as unknown as FastifyInstance["cache"]);
		app.decorate("redis", mockRedis as unknown as FastifyInstance["redis"]);
		app.decorate("minio", mockMinio as unknown as FastifyInstance["minio"]);
		app.decorate("jwt", {
			sign: vi.fn(),
			verify: vi.fn(),
		} as unknown as FastifyInstance["jwt"]);

		// Ensure authentication for both createContext and the preExecution hook.
		app.decorateRequest("jwtVerify", async () => ({
			user: { id: "admin-id" },
		}));

		await app.register(graphql);

		mercuriusClient = createMercuriusTestClient(app, { url: "/graphql" });
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	it("should succeed when cache invalidation succeeds (happy path)", async () => {
		// Ensure cache invalidation succeeds
		mockCache.del.mockResolvedValueOnce(undefined);
		mockCache.clearByPattern.mockResolvedValueOnce(undefined);

		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			variables: {
				input: {
					id: orgId,
					name: updatedName,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toBeDefined();
		expect(result.data?.updateOrganization?.id).toBe(orgId);
		expect(result.data?.updateOrganization?.name).toBe(updatedName);

		expect(mockCache.del).toHaveBeenCalledWith(
			`talawa:v1:organization:${orgId}`,
		);
		expect(mockCache.clearByPattern).toHaveBeenCalledWith(
			"talawa:v1:organization:list:*",
		);

		expect(app.log.error).not.toHaveBeenCalled();
	});

	it("should succeed even when cache invalidation fails (best-effort)", async () => {
		// Simulate cache failure
		mockCache.del.mockRejectedValue(new Error("Redis connection lost"));

		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			variables: {
				input: {
					id: orgId,
					name: updatedName,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toBeDefined();
		expect(result.data?.updateOrganization?.id).toBe(orgId);
		expect(result.data?.updateOrganization?.name).toBe(updatedName);

		expect(mockCache.del).toHaveBeenCalledWith(
			`talawa:v1:organization:${orgId}`,
		);
		expect(mockCache.clearByPattern).toHaveBeenCalledWith(
			"talawa:v1:organization:list:*",
		);

		// Verify logger was called
		expect(app.log.error).toHaveBeenCalledWith(
			expect.objectContaining({
				entity: "organization",
				opIndex: 0, // mockCache.del is the first promise in the array
			}),
			"Cache invalidation failed",
		);
	});
});
