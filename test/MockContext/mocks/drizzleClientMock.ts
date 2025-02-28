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

// QueryTables that match Drizzle’s expected structure
type QueryTables = {
	[K in keyof typeof drizzleSchema]: TableMethods<Record<string, unknown>>;
};

// Function to create table methods with default mocks
function createTableMethods<T>(): TableMethods<T> {
	return {
		findFirst: vi.fn(() => Promise.resolve(undefined)),
		findMany: vi.fn(() => Promise.resolve([])),
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
	};
}
