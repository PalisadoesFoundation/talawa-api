import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";

// 1. Hoisted mocks (same pattern as Advertisement)
const { implementSpy, objectRefSpy } = vi.hoisted(() => {
	const implement = vi.fn();
	const objectRef = vi.fn(() => ({ implement }));
	return { implementSpy: implement, objectRefSpy: objectRef };
});

vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: objectRefSpy,
	},
}));

vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => `escaped_${str}`),
}));

vi.mock("~/src/graphql/enums/AgendaItemType", () => ({
	AgendaItemType: {},
}));

// Import mocked function AFTER vi.mock
import { escapeHTML } from "~/src/utilities/sanitizer";

describe("AgendaItem GraphQL Type", () => {
	/**
	 * Strongly-typed resolver map
	 * (this is what fixes the TS18048 error)
	 */
	interface FieldResolvers {
		name: {
			resolve: (parent: AgendaItem) => string;
		};
		description: {
			resolve: (parent: AgendaItem) => string | null;
		};
		notes: {
			resolve: (parent: AgendaItem) => string | null;
		};
		[key: string]: unknown;
	}

	let fieldResolvers: FieldResolvers;

	beforeAll(async () => {
		// Import the module AFTER mocks are ready
		await import("~/src/graphql/types/AgendaItem/AgendaItem");

		if (implementSpy.mock.calls.length === 0) {
			throw new Error(
				"AgendaItem.implement was not called. Module mocking issue?",
			);
		}

		const implementCall = implementSpy.mock.calls[0]?.[0];
		const fieldsFactory = implementCall.fields;

		// Stub `t` to capture resolver configs
		const tStub = {
			string: vi.fn((opts) => opts),
			exposeString: vi.fn((_name, opts) => opts),
			exposeID: vi.fn((_name, opts) => opts),
			exposeInt: vi.fn((_name, opts) => opts),
			expose: vi.fn((_name, opts) => opts),
		};

		fieldResolvers = fieldsFactory(tStub) as FieldResolvers;
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	/* -------------------- name -------------------- */

	describe("name field resolver", () => {
		it("escapes HTML in name", () => {
			const agendaItem = {
				id: "id-1",
				name: "<script>alert(1)</script>",
			} as AgendaItem;

			const result = fieldResolvers.name.resolve(agendaItem);

			expect(result).toBe("escaped_<script>alert(1)</script>");
			expect(escapeHTML).toHaveBeenCalledWith("<script>alert(1)</script>");
		});

		it("handles empty string name", () => {
			const agendaItem = {
				id: "id-1",
				name: "",
			} as AgendaItem;

			const result = fieldResolvers.name.resolve(agendaItem);

			expect(result).toBe("escaped_");
			expect(escapeHTML).toHaveBeenCalledWith("");
		});
	});

	/* -------------------- description -------------------- */

	describe("description field resolver", () => {
		it("returns null when description is null", () => {
			const agendaItem = {
				id: "id-1",
				description: null,
			} as AgendaItem;

			const result = fieldResolvers.description.resolve(agendaItem);

			expect(result).toBeNull();
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("escapes HTML when description exists", () => {
			const agendaItem = {
				id: "id-1",
				description: "<b>bold</b>",
			} as AgendaItem;

			const result = fieldResolvers.description.resolve(agendaItem);

			expect(result).toBe("escaped_<b>bold</b>");
			expect(escapeHTML).toHaveBeenCalledWith("<b>bold</b>");
		});
	});

	/* -------------------- notes -------------------- */

	describe("notes field resolver", () => {
		it("returns null when notes are null", () => {
			const agendaItem = {
				id: "id-1",
				notes: null,
			} as AgendaItem;

			const result = fieldResolvers.notes.resolve(agendaItem);

			expect(result).toBeNull();
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("escapes HTML when notes exist", () => {
			const agendaItem = {
				id: "id-1",
				notes: "Tom & Jerry <3",
			} as AgendaItem;

			const result = fieldResolvers.notes.resolve(agendaItem);

			expect(result).toBe("escaped_Tom & Jerry <3");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3");
		});
	});
});
