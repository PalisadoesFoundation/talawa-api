import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ActionItem as ActionItemType } from "~/src/graphql/types/ActionItem/ActionItem";

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

type ResolverField = {
	resolve: (...args: unknown[]) => unknown;
};

type ActionItemFieldMap = {
	id: { description: string };
	isCompleted: { description: string };
	isTemplate: { description: string; nullable: boolean };
	assignedAt: { description: string; type: string };
	completionAt: { description: string; type: string; nullable: boolean };
	preCompletionNotes: { description: string; nullable: boolean };
	postCompletionNotes: { description: string; nullable: boolean };
	isInstanceException: ResolverField;
};

describe("ActionItem GraphQL Type", () => {
	let fields: ActionItemFieldMap;

	beforeAll(async () => {
		await import("~/src/graphql/types/ActionItem/ActionItem");

		const implementCall = implementSpy.mock.calls[0]?.[0];
		const fieldsFactory = implementCall.fields;

		const tStub = {
			field: vi.fn((opts) => opts),
			exposeID: vi.fn((_name, opts) => opts),
			exposeBoolean: vi.fn((_name, opts) => opts),
			exposeString: vi.fn((_name, opts) => opts),
			expose: vi.fn((_name, opts) => opts),
		};

		fields = fieldsFactory(tStub) as ActionItemFieldMap;
	});

	it("registers the ActionItem object ref", () => {
		expect(objectRefSpy).toHaveBeenCalledWith("ActionItem");
	});

	it("exposes scalar fields with descriptions", () => {
		expect(fields.id.description).toBe(
			"Unique identifier for the action item.",
		);
		expect(fields.isCompleted.description).toBe(
			"Indicates whether the action item is completed.",
		);
		expect(fields.assignedAt.type).toBe("DateTime");
	});

	it("marks optional fields as nullable", () => {
		expect(fields.isTemplate.nullable).toBe(true);
		expect(fields.completionAt.nullable).toBe(true);
		expect(fields.preCompletionNotes.nullable).toBe(true);
		expect(fields.postCompletionNotes.nullable).toBe(true);
	});

	describe("isInstanceException resolver", () => {
		it("returns true when the parent has an active exception", () => {
			const result = fields.isInstanceException.resolve({
				isInstanceException: true,
			} as unknown as ActionItemType);

			expect(result).toBe(true);
		});

		it("returns false when the parent explicitly has no exception", () => {
			const result = fields.isInstanceException.resolve({
				isInstanceException: false,
			} as unknown as ActionItemType);

			expect(result).toBe(false);
		});

		it("returns false when the parent omits the flag entirely", () => {
			const result = fields.isInstanceException.resolve(
				{} as unknown as ActionItemType,
			);

			expect(result).toBe(false);
		});
	});
});
