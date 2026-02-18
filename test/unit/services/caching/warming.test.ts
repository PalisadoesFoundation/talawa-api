import type { FastifyInstance } from "fastify";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import { warmOrganizations } from "~/src/services/caching/warming";
import { createOrganizationLoader } from "~/src/utilities/dataloaders/organizationLoader";

// Mock dependencies
vi.mock("~/src/utilities/dataloaders/organizationLoader");

interface MockDb {
	select: Mock;
	from: Mock;
	leftJoin: Mock;
	groupBy: Mock;
	orderBy: Mock;
	limit: Mock;
}

interface MockLoader {
	loadMany: Mock;
}

describe("warmOrganizations", () => {
	let server: FastifyInstance;
	let mockDb: MockDb;
	let mockLoader: MockLoader;

	beforeEach(() => {
		mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			leftJoin: vi.fn().mockReturnThis(),
			groupBy: vi.fn().mockReturnThis(),
			orderBy: vi.fn().mockReturnThis(),
			limit: vi.fn().mockResolvedValue([{ id: "org-1" }, { id: "org-2" }]),
		};

		mockLoader = {
			loadMany: vi.fn().mockResolvedValue([null, null]),
		};

		vi.mocked(createOrganizationLoader).mockReturnValue(mockLoader as never);

		// Create a partial mock of FastifyInstance
		const partialServer = {
			envConfig: {
				CACHE_WARMING_ORG_COUNT: 5,
			},
			drizzleClient: mockDb,
			cache: {},
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
			},
		};

		server = partialServer as unknown as FastifyInstance;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should warm top N organizations when count > 0", async () => {
		await warmOrganizations(server);

		expect(mockDb.limit).toHaveBeenCalledWith(5);
		expect(createOrganizationLoader).toHaveBeenCalledWith(mockDb, server.cache);
		expect(mockLoader.loadMany).toHaveBeenCalledTimes(1);
		expect(mockLoader.loadMany).toHaveBeenCalledWith(["org-1", "org-2"]);
		expect(server.log.info).toHaveBeenCalledWith(
			{ warmupCount: 5 },
			"Warming cache for top organizations...",
		);
		expect(server.log.info).toHaveBeenCalledWith(
			"Organization cache warming completed.",
		);
	});

	it("should not warm if CACHE_WARMING_ORG_COUNT is 0", async () => {
		(
			server.envConfig as unknown as {
				CACHE_WARMING_ORG_COUNT: number | undefined;
			}
		).CACHE_WARMING_ORG_COUNT = 0;
		await warmOrganizations(server);

		expect(mockDb.select).not.toHaveBeenCalled();
		expect(createOrganizationLoader).not.toHaveBeenCalled();
	});

	it("should not warm if CACHE_WARMING_ORG_COUNT is undefined", async () => {
		(
			server.envConfig as unknown as {
				CACHE_WARMING_ORG_COUNT: number | undefined;
			}
		).CACHE_WARMING_ORG_COUNT = undefined;
		await warmOrganizations(server);

		expect(mockDb.select).not.toHaveBeenCalled();
		expect(createOrganizationLoader).not.toHaveBeenCalled();
	});

	it("should not warm if server.cache is undefined", async () => {
		// Create a server without cache
		const serverWithoutCache = {
			...server,
			cache: undefined,
		} as unknown as FastifyInstance;

		await warmOrganizations(serverWithoutCache);

		expect(mockDb.limit).not.toHaveBeenCalled();
		expect(createOrganizationLoader).not.toHaveBeenCalled();
		expect(server.log.info).not.toHaveBeenCalled();
	});

	it("should handle empty results gracefully", async () => {
		mockDb.limit.mockResolvedValue([]);
		await warmOrganizations(server);

		expect(mockDb.limit).toHaveBeenCalledWith(5);
		expect(createOrganizationLoader).not.toHaveBeenCalled();
		expect(server.log.info).toHaveBeenCalledWith(
			expect.stringContaining("No organizations found to warm"),
		);
	});

	it("should handle errors gracefully", async () => {
		const error = new Error("DB Error");
		mockDb.limit.mockRejectedValue(error);

		await warmOrganizations(server);

		expect(server.log.error).toHaveBeenCalledWith(
			{ err: error },
			"Failed to warm organization cache.",
		);
	});

	it("should log partial failures", async () => {
		const failures = [new Error("Failed to load org-1"), null];
		// mocks loadMany returning one error and one success (null)
		mockLoader.loadMany.mockResolvedValue(failures);

		await warmOrganizations(server);

		expect(server.log.warn).toHaveBeenCalledWith(
			{
				failures: [{ id: "org-1", error: "Failed to load org-1" }],
			},
			"Organization cache warming completed with partial failures.",
		);
		expect(server.log.info).not.toHaveBeenCalledWith(
			"Organization cache warming completed.",
		);
	});
});
