import readline from "node:readline";
import * as helpers from "scripts/dbManagement/helpers";
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
		// Reset modules if needed. This ensures a fresh instance for each test.
		vi.resetModules();
	});

	test.concurrent("should return true when db.execute resolves", async () => {
		// Override execute to simulate a successful query.
		overrideDbExecute(() => Promise.resolve());
		const result = await helpers.pingDB();
		expect(result).toBe(true);
	});

	test.concurrent("should throw error when db.execute rejects", async () => {
		// Override execute to simulate a failure.
		overrideDbExecute(() => Promise.reject(new Error("connection failed")));
		await expect(helpers.pingDB()).rejects.toThrow(
			"Unable to connect to the database.",
		);
	});
});
