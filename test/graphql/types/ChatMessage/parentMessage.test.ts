import type { GraphQLObjectType } from "graphql";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { schemaManager } from "~/src/graphql/schemaManager";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";

/**
 * Unit tests for ChatMessage.parentMessage resolver
 */

let parentMessageResolver: (
	parent: { parentMessageId: string | null },
	args: unknown,
	ctx: unknown,
	info: unknown,
) => Promise<unknown>;

beforeAll(async () => {
	const schema = await schemaManager.buildInitialSchema();

	const chatMessageType = schema.getType("ChatMessage") as GraphQLObjectType;

	assertToBeNonNullish(chatMessageType);

	const fields = chatMessageType.getFields();
	const parentMessageField = fields.parentMessage;

	assertToBeNonNullish(parentMessageField);
	assertToBeNonNullish(parentMessageField.resolve);

	// Cast resolver to a test-friendly signature
	parentMessageResolver = parentMessageField.resolve as unknown as (
		parent: { parentMessageId: string | null },
		args: unknown,
		ctx: unknown,
		info: unknown,
	) => Promise<unknown>;
});

// Helper to create mocked context
function createMockContext(findFirstResult: unknown) {
	return {
		drizzleClient: {
			query: {
				chatMessagesTable: {
					findFirst: vi.fn().mockResolvedValue(findFirstResult),
				},
			},
		},
		log: {
			error: vi.fn(),
		},
	};
}

describe("ChatMessage.parentMessage resolver", () => {
	test("returns null when parentMessageId is null", async () => {
		const parent = { parentMessageId: null };
		const ctx = createMockContext(null);

		const result = await parentMessageResolver(parent, {}, ctx, {});
		expect(result).toBeNull();
		expect(
			ctx.drizzleClient.query.chatMessagesTable.findFirst,
		).not.toHaveBeenCalled();
	});

	test("returns parent message when parent exists", async () => {
		const parent = { parentMessageId: "parent-id" };
		const fakeParentMessage = { id: "parent-id", body: "Parent message" };
		const mockEq = vi.fn();
		const ctx = {
			drizzleClient: {
				query: {
					chatMessagesTable: {
						findFirst: vi.fn().mockImplementation((args) => {
							// Execute the where callback to cover operators.eq logic
							const mockFields = { id: "mock-field-id" };
							const mockOperators = { eq: mockEq };
							args.where(mockFields, mockOperators);
							return Promise.resolve(fakeParentMessage);
						}),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		};
		const result = await parentMessageResolver(parent, {}, ctx, {});
		expect(result).toEqual(fakeParentMessage);
		expect(
			ctx.drizzleClient.query.chatMessagesTable.findFirst,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.any(Function),
			}),
		);
		// Verify the where callback invoked operators.eq with correct parameters
		expect(mockEq).toHaveBeenCalledWith("mock-field-id", "parent-id");
	});

	test("throws TalawaGraphQLError when parent message is missing", async () => {
		const parent = { parentMessageId: "missing-id" };
		const mockEq = vi.fn();

		const ctx = {
			drizzleClient: {
				query: {
					chatMessagesTable: {
						findFirst: vi.fn().mockImplementation((args) => {
							// Execute the where callback to cover operators.eq logic
							const mockFields = { id: "mock-field-id" };
							const mockOperators = { eq: mockEq };
							args.where(mockFields, mockOperators);
							return Promise.resolve(undefined);
						}),
					},
				},
			},
			log: {
				error: vi.fn(),
			},
		};

		await expect(
			parentMessageResolver(parent, {}, ctx, {}),
		).rejects.toBeInstanceOf(TalawaGraphQLError);

		expect(ctx.log.error).toHaveBeenCalled();
		// Verify the where callback invoked operators.eq with correct parameters
		expect(mockEq).toHaveBeenCalledWith("mock-field-id", "missing-id");
	});
});
