import type { FastifyBaseLogger } from "fastify";
import type { Client as MinioClient } from "minio";
import { createMockLogger } from "test/utilities/mockLogger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { deleteAgendaItemResolver } from "~/src/graphql/types/Mutation/deleteAgendaItem";

interface MockDrizzleClient {
	query: {
		usersTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
		agendaItemsTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
	};
	delete: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	returning: ReturnType<typeof vi.fn>;
}

// Simplified TestContext that uses the mock client
interface TestContext extends Omit<GraphQLContext, "log" | "drizzleClient"> {
	drizzleClient: MockDrizzleClient & GraphQLContext["drizzleClient"];
	log: FastifyBaseLogger;
}

// Mock the Drizzle client
const drizzleClientMock = {
	query: {
		usersTable: {
			findFirst: vi.fn(),
		},
		agendaItemsTable: {
			findFirst: vi.fn(),
		},
	},
	delete: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	returning: vi.fn(),
} as TestContext["drizzleClient"];

const mockLogger = createMockLogger();

const authenticatedContext: TestContext = {
	currentClient: {
		isAuthenticated: true,
		user: {
			id: "user_1",
		},
	},
	drizzleClient: drizzleClientMock,
	log: mockLogger,
	envConfig: {
		API_BASE_URL: "http://localhost:3000",
	},
	jwt: {
		sign: vi.fn().mockReturnValue("mock-token"),
	},
	minio: {
		bucketName: "talawa",
		client: {} as MinioClient, // minimal mock that satisfies the type
	},
	pubsub: {
		publish: vi.fn(),
		subscribe: vi.fn(),
	},
};

const unauthenticatedContext: TestContext = {
	...authenticatedContext,
	currentClient: {
		isAuthenticated: false,
	},
};

describe("deleteAgendaItem", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});
	// user is unauthenticated
	it("should throw an error if the user is not authenticated", async () => {
		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "1",
					},
				},
				unauthenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: { code: "unauthenticated" },
			}),
		);
	});
	it("should throw invalid_arguments error when deleting agenda item with invalid UUID format", async () => {
		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "invalid-id",
					},
				},
				authenticatedContext,
			),
		).rejects.toMatchObject({
			extensions: { code: "invalid_arguments" },
		});
	});

	it("should throw unauthenticated error when user ID from token is not found in database", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue(undefined);
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "unauthenticated",
				},
			}),
		);
	});
	it("should throw arguments_associated_resources_not_found error when agenda item ID does not exist", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "arguments_associated_resources_not_found",
					issues: [
						{
							argumentPath: ["input", "id"],
						},
					],
				},
			}),
		);
	});

	it("should throw unauthorized_action error when non-admin user attempts to delete agenda item", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			isAgendaItemFolder: true,
			folder: {
				startAt: "2025-02-19T10:00:00.000Z",
				event: {
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [
							{
								role: "regular",
							},
						],
					},
				},
			},
		});

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "id"],
						},
					],
				},
			}),
		);
	});

	it("should throw unauthorized_action error when non admin user attempts to delete agenda item  and current user organization membership is undefined", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			isAgendaItemFolder: true,
			folder: {
				startAt: "2025-02-19T10:00:00.000Z",
				event: {
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [],
					},
				},
			},
		});

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "id"],
						},
					],
				},
			}),
		);
	});

	it("should delete the agenda item successfully", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			isAgendaItemFolder: true,
			folder: {
				startAt: "2025-02-19T10:00:00.000Z",
				event: {
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [
							{
								role: "administrator",
							},
						],
					},
				},
			},
		});
		drizzleClientMock.delete.mockReturnValue({
			where: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([
				{
					id: "123e4567-e89b-12d3-a456-426614174000",
				},
			]),
		});

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).resolves.toEqual({
			id: "123e4567-e89b-12d3-a456-426614174000",
		});
	});

	// it should fail to delete the agenda item
	it("should fail to delete the agenda item", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			isAgendaItemFolder: true,
			folder: {
				startAt: "2025-02-19T10:00:00.000Z",
				event: {
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [
							{
								role: "administrator",
							},
						],
					},
				},
			},
		});
		drizzleClientMock.delete.mockReturnValue({
			where: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([]),
		});

		await expect(
			deleteAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "unexpected",
				},
			}),
		);
	});
});
