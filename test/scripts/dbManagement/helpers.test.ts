import fs from "node:fs/promises";
import readline from "node:readline";
import * as helpers from "scripts/dbManagement/helpers";
import * as schema from "src/drizzle/schema";
import { beforeEach, expect, suite, test, vi } from "vitest";

suite.concurrent("parseDate", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	test.concurrent(
		"should return a valid Date object for a valid date string",
		async () => {
			const input = "2021-12-31";
			const result = helpers.parseDate(input);
			expect(result).not.toBeNull();
			if (result !== null) {
				// Compare ISO strings to avoid timezone issues
				expect(result.toISOString()).toBe(new Date(input).toISOString());
			}
		},
	);

	test.concurrent(
		"should return valid Date objects for a valid number timestamp and Date object",
		async () => {
			// Test using a numeric timestamp
			const timestamp = 1609459200000; // Jan 1, 2021 00:00:00 GMT
			const resultFromNumber = helpers.parseDate(timestamp);
			expect(resultFromNumber).not.toBeNull();
			if (resultFromNumber !== null) {
				expect(resultFromNumber.getTime()).toBe(timestamp);
			}

			// Test using an already existing Date object
			const dateObj = new Date("2021-12-31T00:00:00Z");
			const resultFromDate = helpers.parseDate(dateObj);
			expect(resultFromDate).not.toBeNull();
			if (resultFromDate !== null) {
				expect(resultFromDate.toISOString()).toBe(dateObj.toISOString());
			}
		},
	);

	test.concurrent("should return null for invalid date inputs", async () => {
		// Test an invalid date string
		expect(helpers.parseDate("invalid-date")).toBeNull();
		// Test an invalid number (NaN)
		expect(helpers.parseDate(Number.NaN)).toBeNull();
	});
});

suite.concurrent("askUserToContinue", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	test.concurrent("should resolve to true when user inputs 'y'", async () => {
		const fakeInterface = {
			question: (query: string, callback: (answer: string) => void) => {
				callback("y");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(true);
		expect(fakeInterface.close).toHaveBeenCalled();
	});

	test.concurrent("should resolve to false when user inputs 'n'", async () => {
		const fakeInterface = {
			question: (query: string, callback: (answer: string) => void) => {
				callback("n");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(false);
		expect(fakeInterface.close).toHaveBeenCalled();
	});

	test.concurrent("should trim and ignore case in the input", async () => {
		const fakeInterface = {
			question: (query: string, callback: (answer: string) => void) => {
				callback("  Y  ");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(true);
		expect(fakeInterface.close).toHaveBeenCalled();
	});
});

const overrideDbExecute = (newExecute: () => Promise<unknown>): void => {
	Reflect.set(helpers.db, "execute", newExecute);
};

suite.concurrent("pingDB", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	test.concurrent("should return true when db.execute resolves", async () => {
		overrideDbExecute(() => Promise.resolve());
		const result = await helpers.pingDB();
		expect(result).toBe(true);
	});

	test.concurrent("should throw error when db.execute rejects", async () => {
		overrideDbExecute(() => Promise.reject(new Error("connection failed")));
		await expect(helpers.pingDB()).rejects.toThrow(
			"Unable to connect to the database.",
		);
	});
});

suite.concurrent("listSampleData", () => {
	test.concurrent(
		"should list sample data files and return true using the original sample_data",
		async () => {
			const result = await helpers.listSampleData();
			expect(result).toBe(true);
		},
	);

	test.concurrent(
		"should handle an error while listing sample data",
		async () => {
			vi.spyOn(fs, "readdir").mockRejectedValue(
				new Error("Failed to read directory"),
			);

			await expect(helpers.listSampleData()).rejects.toThrow(
				"Error listing sample data: Error: Failed to read directory",
			);

			vi.restoreAllMocks();
		},
	);
});

suite.concurrent("emptyMinioBucket", () => {
	test.concurrent("should empty the Minio bucket and return true", async () => {
		const result = await helpers.emptyMinioBucket();
		expect(result).toBe(true);
	});
	test.concurrent("should return false if listing objects fails", async () => {
		const minioClient = Reflect.get(helpers, "minioClient");
		const originalListObjects = minioClient.listObjects;
		minioClient.listObjects = () => {
			const { Readable } = require("node:stream");
			const stream = new Readable({ read() {} });
			process.nextTick(() => {
				stream.emit("error", new Error("Failed to list objects"));
				stream.push(null);
			});
			return stream;
		};

		const result = await helpers.emptyMinioBucket();
		expect(result).toBe(false);

		minioClient.listObjects = originalListObjects;
	});
});

suite.concurrent("checkAndInsertData", () => {
	test.concurrent("should return false when given no rows", async () => {
		const result = await helpers.checkAndInsertData(
			schema.usersTable,
			[],
			schema.usersTable.id,
			1000,
		);
		expect(result).toBe(false);
	});

	test.concurrent("should throw error if transaction fails", async () => {
		// Override db.transaction to simulate a failure.
		const db = Reflect.get(helpers, "db");
		const originalTransaction = db.transaction;
		db.transaction = async () => {
			throw new Error("Transaction failed");
		};

		await expect(
			helpers.checkAndInsertData(
				schema.usersTable,
				[{ id: 1 }],
				schema.usersTable.id,
				1000,
			),
		).rejects.toThrow("Transaction failed");

		db.transaction = originalTransaction;
	});
});

suite.concurrent("insertCollections", () => {
	test.concurrent(
		"should insert collection data (for a valid collection) and return true",
		async () => {
			const result = await helpers.insertCollections([
				"users",
				"organizations",
				"organization_memberships",
				"posts",
				"post_votes",
				"post_attachments",
				"comments",
				"comment_votes",
			]);
			expect(result).toBe(true);
		},
	);

	test.concurrent(
		"should throw error for an invalid collection name",
		async () => {
			await expect(
				helpers.insertCollections(["invalid_collection"]),
			).rejects.toThrow(/Error adding data to tables:/);
		},
	);
});

suite.concurrent("checkDataSize integration test", () => {
	test.concurrent(
		"should return a boolean indicating record existence",
		async () => {
			const result = await helpers.checkDataSize("Test Stage");
			expect(typeof result).toBe("boolean");
		},
	);
	test.concurrent("should return false if db query fails", async () => {
		const db = Reflect.get(helpers, "db");
		const originalSelect = db.select;
		db.select = () => {
			throw new Error("Query failed");
		};

		const result = await helpers.checkDataSize("Test Stage");
		expect(result).toBe(false);
		db.select = originalSelect;
	});
});

// cannot be run concurrently
suite("formatDatabase integration test", () => {
	test.concurrent("should format the database and return true", async () => {
		const result = await helpers.formatDatabase();
		expect(result).toBe(true);
	});
});

suite.concurrent("disconnect integration test", () => {
	test.concurrent(
		"should return true when queryClient.end resolves",
		async () => {
			const queryClient = Reflect.get(helpers, "queryClient");
			const originalEnd = queryClient.end;

			queryClient.end = async () => Promise.resolve();

			const result = await helpers.disconnect();
			expect(result).toBe(true);

			queryClient.end = originalEnd;
		},
	);

	test.concurrent(
		"should throw error when queryClient.end rejects",
		async () => {
			const queryClient = Reflect.get(helpers, "queryClient");
			const originalEnd = queryClient.end;

			queryClient.end = async () =>
				Promise.reject(new Error("disconnect failed"));

			await expect(helpers.disconnect()).rejects.toThrow(
				/Error disconnecting from the database:/,
			);

			queryClient.end = originalEnd;
		},
	);
});
