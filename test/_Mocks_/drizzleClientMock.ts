import { type Mock, vi } from "vitest";
import * as drizzleSchema from "~/src/drizzle/schema";

// table method mocks
type TableMethods<T> = {
	findFirst: Mock<() => Promise<T | undefined>>;
	findMany: Mock<() => Promise<T[]>>;
	insert: Mock<() => Promise<T>>;
	update: Mock<() => Promise<T>>;
	delete: Mock<() => Promise<void>>;
	count: Mock<() => Promise<number>>;
};

// QueryTables that match Drizzle's expected structure
type QueryTables = {
	[K in keyof typeof drizzleSchema]: TableMethods<Record<string, unknown>>;
};

// Function to create table methods with default mocks
function createTableMethods<T>(): TableMethods<T> {
	return {
		findFirst: vi.fn(), // Must be configured in individual tests with specific return values
		findMany: vi.fn(), // Must be configured in individual tests with specific return values
		insert: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		count: vi.fn(() => Promise.resolve(0)),
	};
}

export function createMockDrizzleClient() {
	const queryTables = Object.keys(drizzleSchema).reduce<QueryTables>(
		(acc, tableName) => {
			acc[tableName as keyof typeof drizzleSchema] = createTableMethods();
			return acc;
		},
		{} as QueryTables,
	);

	return {
		query: queryTables,
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn(() => Promise.resolve([])),
				orderBy: vi.fn(() => ({
					limit: vi.fn(() => Promise.resolve([])),
				})),
			})),
		})),
		// Global insert, update, delete methods
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(() => Promise.resolve([])),
			})),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([])),
				})),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn(() => ({
				returning: vi.fn(() => Promise.resolve([])),
			})),
		})),
	};
}
