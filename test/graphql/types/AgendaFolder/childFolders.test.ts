import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { resolveChildFolders, childFoldersComplexity } from "~/src/graphql/types/AgendaFolder/childFolders";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
// Loads the GraphQL schema to initialize all type definitions
import "~/src/graphql/schema";
import { builder } from "~/src/graphql/builder";

describe("AgendaFolder childFolders resolver", () => {
	let ctx: any;
	let mocks: any;
	const parent = { id: "parent-1" };

	beforeEach(() => {
		const result = createMockGraphQLContext(true, "user-1");
		ctx = result.context;
		mocks = result.mocks;
	});


	it("builds GraphQL schema to trigger complexity function execution", () => {
		// Create the GraphQL schema - this ensures all field definitions are processed
		const schema = builder.toSchema();
		const agendaFolderType = schema.getType("AgendaFolder");
		expect(agendaFolderType).toBeDefined();
	});

	it("executes childFoldersComplexity function with different arguments", () => {
		// Test complexity calculation with first parameter - should use first value
		const complexityWithFirst = childFoldersComplexity({ first: 5 });
		expect(complexityWithFirst.multiplier).toBe(5);
		expect(complexityWithFirst.field).toBeDefined();

		// Test complexity calculation with last parameter - should use last value
		const complexityWithLast = childFoldersComplexity({ last: 10 });
		expect(complexityWithLast.multiplier).toBe(10);

		// Test complexity calculation with no parameters - should default to 1
		const complexityWithNeither = childFoldersComplexity({});
		expect(complexityWithNeither.multiplier).toBe(1);

		// Test complexity when both provided - first parameter takes priority
		const complexityWithBoth = childFoldersComplexity({ first: 3, last: 7 });
		expect(complexityWithBoth.multiplier).toBe(3);
	});

	it("throws invalid_arguments for malformed cursor when isInversed true (before)", async () => {
		await expect(
			resolveChildFolders(parent, { last: 1, before: "not-a-valid-base64" }, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		try {
			await resolveChildFolders(parent, { last: 1, before: "not-a-valid-base64" }, ctx);
		} catch (e: any) {
			expect(e.extensions.code).toBe("invalid_arguments");
			expect(e.extensions.issues[0].argumentPath).toEqual(["before"]);
		}
	});

	it("throws associated_resources_not_found for inversed (before) cursor when no rows returned", async () => {
		const cursor = Buffer.from(
			JSON.stringify({ id: "01234567-89ab-cdef-0123-456789abcdef", name: "N" }),
		).toString("base64url");
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([]);
		await expect(
			resolveChildFolders(parent, { last: 1, before: cursor }, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		try {
			await resolveChildFolders(parent, { last: 1, before: cursor }, ctx);
		} catch (e: any) {
			expect(e.extensions.code).toBe("arguments_associated_resources_not_found");
			expect(e.extensions.issues[0].argumentPath).toEqual(["before"]);
		}
	});

	it("calls exists subquery when 'last' + 'before' cursor provided", async () => {
		const cursor = Buffer.from(
			JSON.stringify({ id: "01234567-89ab-cdef-0123-456789abcdef", name: "CursorName" }),
		).toString("base64url");

		// Mock the database select/where methods to verify the exists() subquery is called
		const whereMock = vi.fn();
		ctx.drizzleClient.select = vi.fn(() => ({
			from: vi.fn(() => ({
				where: (fn: any) => {
					whereMock(fn);
					return {};
				},
			})),
		}));

		// Mock database response with folder data
		const raw = [{ id: "a1", name: "A", parentFolderId: "parent-1" }];
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(raw);

		const res = await resolveChildFolders(parent, { last: 1, before: cursor }, ctx);
		expect(res.edges.length).toBe(1);
		expect(whereMock).toHaveBeenCalled();
	});

	it("calls exists subquery when 'first' + 'after' cursor provided", async () => {
		const cursor = Buffer.from(
			JSON.stringify({ id: "01234567-89ab-cdef-0123-456789abcdef", name: "CursorName" }),
		).toString("base64url");

		// Mock the database select/where methods to verify the exists() subquery is called
		const whereMock = vi.fn();
		ctx.drizzleClient.select = vi.fn(() => ({
			from: vi.fn(() => ({
				where: (fn: any) => {
					whereMock(fn);
					return {};
				},
			})),
		}));

		// Mock database response with folder data
		const raw = [{ id: "b1", name: "B", parentFolderId: "parent-1" }];
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(raw);

		const res = await resolveChildFolders(parent, { first: 1, after: cursor }, ctx);
		expect(res.edges.length).toBe(1);
		expect(whereMock).toHaveBeenCalled();
	});

	it("throws invalid_arguments when required arguments missing", async () => {
		await expect(resolveChildFolders(parent, {}, ctx)).rejects.toBeInstanceOf(
			TalawaGraphQLError,
		);
		try {
			await resolveChildFolders(parent, {}, ctx);
		} catch (e: any) {
			expect(e.extensions.code).toBe("invalid_arguments");
			expect(Array.isArray(e.extensions.issues)).toBeTruthy();
		}
	});

	it("throws invalid_arguments when given malformed cursor", async () => {
		await expect(
			resolveChildFolders(parent, { first: 1, after: "not-a-valid-base64" }, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		try {
			await resolveChildFolders(parent, { first: 1, after: "not-a-valid-base64" }, ctx);
		} catch (e: any) {
			expect(e.extensions.code).toBe("invalid_arguments");
			// The error should point to 'after' argument when using first/after
			expect(e.extensions.issues[0].argumentPath).toEqual(["after"]);
		}
	});

	it("returns a connection when called with first and no cursor", async () => {
		const raw = [
			{ id: "f1", name: "A", parentFolderId: "parent-1" },
		];
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(raw);

		const res = await resolveChildFolders(parent, { first: 1 }, ctx);
		expect(res.edges.length).toBe(1);
		expect(res.edges[0]!.node).toEqual(raw[0]);
		expect(res.pageInfo.hasNextPage).toBe(false);
		expect(res.pageInfo.hasPreviousPage).toBe(false);
	});

	it("throws associated_resources_not_found when cursor provided but no rows returned", async () => {
		const cursor = Buffer.from(
			JSON.stringify({ id: "01234567-89ab-cdef-0123-456789abcdef", name: "N" }),
		).toString("base64url");
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue([]);
		await expect(
			resolveChildFolders(parent, { first: 1, after: cursor }, ctx),
		).rejects.toBeInstanceOf(TalawaGraphQLError);
		try {
			await resolveChildFolders(parent, { first: 1, after: cursor }, ctx);
		} catch (e: any) {
			expect(e.extensions.code).toBe("arguments_associated_resources_not_found");
		}
	});

	it("handles inversed (last) pagination and hasPreviousPage logic", async () => {
		// Setup test data for backwards pagination (last 2 items)
		const raw = [
			{ id: "1", name: "one", parentFolderId: "parent-1" },
			{ id: "2", name: "two", parentFolderId: "parent-1" },
			{ id: "3", name: "three", parentFolderId: "parent-1" },
		];
		mocks.drizzleClient.query.agendaFoldersTable.findMany.mockResolvedValue(raw);

		const res = await resolveChildFolders(parent, { last: 2 }, ctx);
		// When getting last items, should indicate there are more items before this set
		expect(res.pageInfo.hasPreviousPage).toBe(true);
		// Items should be in reverse order for backwards pagination
		expect(res.edges.map((e: any) => e.node.name)).toEqual(["two", "one"]);
	});
});
