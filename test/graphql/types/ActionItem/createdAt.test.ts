/// <reference types="vitest" />

import { describe, expect, test, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { resolveCreatedAt } from "../../../../src/graphql/types/ActionItems/createdAt";

// A helper to create a mock context.
// Note: We provide dummy values for required properties from GraphQLContext.
const createMockCtx = () => {
	// Create a mock function for the findFirst method.
	const findFirstMock = vi.fn();

	const ctx = {
		drizzleClient: {
			query: {
				usersTable: {
					findFirst: findFirstMock,
				},
			},
		},
		log: {
			error: vi.fn(),
		},
		// Required properties in your GraphQL context:
		currentClient: {
			isAuthenticated: true,
			user: { id: "user-123", role: "member" },
		},
		envConfig: {},
		jwt: {},
		miniots: {},
	} as unknown as GraphQLContext;

	return {
		ctx,
		mocks: {
			findFirst: findFirstMock,
		},
	};
};

describe("resolveCreatedAt", () => {
	const parent = {
		createdAt: new Date("2023-01-01T00:00:00Z"),
		organizationId: "org-123",
	};

	test("throws unauthenticated error if client is not authenticated", async () => {
		const { ctx } = createMockCtx();
		ctx.currentClient.isAuthenticated = false;
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws unauthenticated error if current user is undefined", async () => {
		const { ctx, mocks } = createMockCtx();
		mocks.findFirst.mockResolvedValue(undefined);
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws unauthorized error if user is not admin and has no organization membership", async () => {
		const { ctx, mocks } = createMockCtx();
		mocks.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [],
		});
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("throws unauthorized error if user is not admin and membership role is not administrator", async () => {
		const { ctx, mocks } = createMockCtx();
		mocks.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{ role: "member", organizationId: parent.organizationId },
			],
		});
		await expect(resolveCreatedAt(parent, {}, ctx)).rejects.toThrow(
			TalawaGraphQLError,
		);
	});

	test("returns createdAt if user is administrator", async () => {
		const { ctx, mocks } = createMockCtx();
		mocks.findFirst.mockResolvedValue({
			role: "administrator",
			organizationMembershipsWhereMember: [],
		});
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toEqual(parent.createdAt);
	});

	test("returns createdAt if user is not admin but membership role is administrator", async () => {
		const { ctx, mocks } = createMockCtx();
		mocks.findFirst.mockResolvedValue({
			role: "member",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: parent.organizationId },
			],
		});
		const result = await resolveCreatedAt(parent, {}, ctx);
		expect(result).toEqual(parent.createdAt);
	});
});
