import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Advertisement } from "~/src/graphql/types/Advertisement/Advertisement";

// 1. Setup mocks with vi.hoisted to ensure they are available to vi.mock
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

vi.mock("~/src/graphql/enums/AdvertisementType", () => ({
	AdvertisementType: {},
}));

vi.mock(
	"~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment",
	() => ({
		AdvertisementAttachment: {},
	}),
);

// Import mocked module after vi.mock setup
import { escapeHTML } from "~/src/utilities/sanitizer";

describe("Advertisement GraphQL Type", () => {
	interface FieldResolvers {
		description: {
			resolve: (parent: Advertisement) => string | null;
		};
		name: {
			resolve: (parent: Advertisement) => string;
		};
		[key: string]: unknown;
	}

	let fieldResolvers: FieldResolvers;

	beforeAll(async () => {
		// Dynamically import the module to ensure mocks are active
		// and to handle side-effects predictably.
		await import("~/src/graphql/types/Advertisement/Advertisement");

		// Extract the resolvers from the implement call
		// The call is: Advertisement.implement({ fields: (t) => ... })
		// We expect the module import to have triggered variables.

		if (implementSpy.mock.calls.length === 0) {
			throw new Error(
				"Advertisement.implement was not called. Module mocking issue?",
			);
		}

		const implementCall = implementSpy.mock.calls[0]?.[0]; // First argument of first call
		const fieldsFactory = implementCall.fields;

		// Create a mock 't' (schema builder) to capture field definitions
		// We need to return the options object to access 'resolve' later.
		const tStub = {
			expose: vi.fn((_name, opts) => opts),
			exposeString: vi.fn((_name, opts) => opts),
			exposeID: vi.fn((_name, opts) => opts),
			string: vi.fn((opts) => opts),
			field: vi.fn((opts) => opts),
			listRef: vi.fn((_ref, opts) => opts),
		};

		// Execute the fields factory to get the field definitions
		fieldResolvers = fieldsFactory(tStub);
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("description field resolver", () => {
		it("should use the captured resolver to return null when description is null", () => {
			const descriptionDef = fieldResolvers.description;
			expect(descriptionDef).toBeDefined();
			expect(descriptionDef.resolve).toBeDefined();

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: null,
				attachments: null,
			} as Advertisement;

			const result = descriptionDef.resolve(advertisement);

			expect(result).toBe(null);
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should use the captured resolver to escape HTML when description is provided", () => {
			const descriptionDef = fieldResolvers.description;
			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "Test Description",
				attachments: null,
			} as Advertisement;

			const result = descriptionDef.resolve(advertisement);

			expect(result).toBe("escaped_Test Description");
			expect(escapeHTML).toHaveBeenCalledWith("Test Description");
		});
	});

	describe("name field resolver", () => {
		it("should use the captured resolver to escape HTML in name", () => {
			const nameDef = fieldResolvers.name;
			expect(nameDef).toBeDefined();
			expect(nameDef.resolve).toBeDefined();

			const advertisement = {
				id: "test-id",
				name: "Test Name",
				description: null,
				attachments: null,
			} as Advertisement;

			const result = nameDef.resolve(advertisement);

			expect(result).toBe("escaped_Test Name");
			expect(escapeHTML).toHaveBeenCalledWith("Test Name");
		});

		it("should handle empty string name correctly", () => {
			const nameDef = fieldResolvers.name;
			const advertisement = {
				id: "test-id",
				name: "",
				description: null,
				attachments: null,
			} as Advertisement;

			const result = nameDef.resolve(advertisement);

			expect(result).toBe("escaped_");
			expect(escapeHTML).toHaveBeenCalledWith("");
		});

		it("should escape HTML characters in name", () => {
			const nameDef = fieldResolvers.name;
			const rawName = "<script>alert(1)</script>";
			const advertisement = {
				id: "test-id",
				name: rawName,
				description: null,
				attachments: null,
			} as Advertisement;

			const result = nameDef.resolve(advertisement);

			expect(result).toBe(`escaped_${rawName}`);
			expect(escapeHTML).toHaveBeenCalledWith(rawName);
		});
	});
});
