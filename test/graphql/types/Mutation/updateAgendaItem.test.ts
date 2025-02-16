import type { FastifyBaseLogger } from "fastify";
import type { Client as MinioClient } from "minio";
import { createMockLogger } from "test/utilities/mockLogger";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { updateAgendaItemResolver } from "~/src/graphql/types/Mutation/updateAgendaItem";

interface MockDrizzleClient {
	query: {
		usersTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
		agendaItemsTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
		agendaFoldersTable: {
			findFirst: ReturnType<typeof vi.fn>;
		};
	};
	update: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
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
		agendaFoldersTable: {
			findFirst: vi.fn(),
		},
	},
	update: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	returning: vi.fn(),
} as unknown as TestContext["drizzleClient"];

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

describe("updateAgendaItemResolver", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	/**
	 * Test authentication check
	 * Verifies that the resolver rejects unauthorized access attempts
	 * Expected: Returns unauthenticated error when client is not authenticated
	 */

	it("should throw unauthenticated error when attempting to update agenda item without authentication", async () => {
		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
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

	it("should throw invalid_arguments error when updating agenda item with invalid UUID format", async () => {
		await expect(
			updateAgendaItemResolver(
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

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
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
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
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

	it("should throw unauthorized_action error when non-admin user attempts to update agenda item", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				event: {
					organization: {
						membershipsWhereOrganization: [],
					},
				},
			},
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
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

	it.each([
		{
			type: "note",
			input: { duration: "10", key: "C" },
			expectedIssues: [
				{
					argumentPath: ["input", "duration"],
					message: 'Cannot be provided for an agenda item of type "note"',
				},
				{
					argumentPath: ["input", "key"],
					message: 'Cannot be provided for an agenda item of type "note"',
				},
			],
		},
	])(
		"should throw forbidden_action error for invalid fields on %s-type agenda item",
		async ({ type, input, expectedIssues }) => {
			drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
				type,
				folder: {
					event: {
						organization: {
							membershipsWhereOrganization: [{ role: "administrator" }],
						},
					},
				},
			});

			await expect(
				updateAgendaItemResolver(
					{},
					{
						input: {
							id: "123e4567-e89b-12d3-a456-426614174000",
							...input,
						},
					},
					authenticatedContext,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					message: expect.any(String),
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expectedIssues,
					},
				}),
			);
		},
	);

	it("should throw forbidden_action error when attempting to set key for general-type agenda item", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						key: "C",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "key"],
							message:
								'Cannot be provided for an agenda item of type "general"',
						},
					],
				},
			}),
		);
	});

	it("should throw arguments_associated_resources_not_found error when specified folder ID does not exist", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
		drizzleClientMock.query.agendaFoldersTable.findFirst.mockResolvedValue(
			undefined,
		);

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						folderId: "123e4567-e89b-12d3-a456-426614174001",
						name: "Updated Name",
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
							argumentPath: ["input", "folderId"],
						},
					],
				},
			}),
		);
	});

	it("should throw forbidden_action error when target folder belongs to different event", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
		drizzleClientMock.query.agendaFoldersTable.findFirst.mockResolvedValue({
			eventId: "event_2",
			isAgendaItemFolder: true,
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						folderId: "123e4567-e89b-12d3-a456-426614174001",
						name: "Updated Name",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "folderId"],
							message:
								"This agenda folder does not belong to the event to the agenda item.",
						},
					],
				},
			}),
		);
	});

	it("should throw forbidden_action error when target folder is not marked as agenda item folder", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
		drizzleClientMock.query.agendaFoldersTable.findFirst.mockResolvedValue({
			eventId: "event_1",
			isAgendaItemFolder: false,
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						folderId: "123e4567-e89b-12d3-a456-426614174001",
						name: "Updated Name",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "folderId"],
							message: "This agenda folder cannot be a folder to agenda items.",
						},
					],
				},
			}),
		);
	});

	it("should successfully update agenda item when admin user provides valid input", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
		drizzleClientMock.query.agendaFoldersTable.findFirst.mockResolvedValue({
			eventId: "event_1",
			isAgendaItemFolder: true,
		});
		drizzleClientMock.update.mockReturnValue({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			returning: vi
				.fn()
				.mockResolvedValue([
					{ id: "123e4567-e89b-12d3-a456-426614174000", name: "Updated Name" },
				]),
		});

		const result = await updateAgendaItemResolver(
			{},
			{
				input: {
					id: "123e4567-e89b-12d3-a456-426614174000",
					name: "Updated Name",
				},
			},
			authenticatedContext,
		);

		expect(result).toEqual({
			id: "123e4567-e89b-12d3-a456-426614174000",
			name: "Updated Name",
		});
	});

	it("should throw unexpected error when database update operation returns empty result", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
		drizzleClientMock.update.mockReturnValue({
			set: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([]),
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
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

	// Test for scripture-type agenda item with key
	it("should throw forbidden_action error when attempting to set key for scripture-type agenda item", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "scripture",
			folder: {
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});

		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						key: "C",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
				message: expect.any(String),
				extensions: {
					code: "forbidden_action_on_arguments_associated_resources",
					issues: [
						{
							argumentPath: ["input", "key"],
							message:
								'Cannot be provided for an agenda item of type "scripture"',
						},
					],
				},
			}),
		);
	});

	// Helper function to reduce setup code duplication
	const setupNoteTypeAgendaItemTest = () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "administrator",
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "note",
			folder: {
				event: {
					organization: {
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				},
			},
		});
	};

	describe("note-type agenda item validations", () => {
		beforeEach(() => {
			setupNoteTypeAgendaItemTest();
		});

		it("should throw forbidden_action error when attempting to set both duration and key", async () => {
			await expect(
				updateAgendaItemResolver(
					{},
					{
						input: {
							id: "123e4567-e89b-12d3-a456-426614174000",
							duration: "10",
							key: "C",
						},
					},
					authenticatedContext,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							{
								argumentPath: ["input", "duration"],
								message: 'Cannot be provided for an agenda item of type "note"',
							},
							{
								argumentPath: ["input", "key"],
								message: 'Cannot be provided for an agenda item of type "note"',
							},
						]),
					},
				}),
			);
		});

		it("should throw forbidden_action error when attempting to set only duration", async () => {
			await expect(
				updateAgendaItemResolver(
					{},
					{
						input: {
							id: "123e4567-e89b-12d3-a456-426614174000",
							duration: "10",
						},
					},
					authenticatedContext,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "duration"],
								message: 'Cannot be provided for an agenda item of type "note"',
							},
						],
					},
				}),
			);
		});

		it("should throw forbidden_action error when attempting to set only key", async () => {
			await expect(
				updateAgendaItemResolver(
					{},
					{
						input: {
							id: "123e4567-e89b-12d3-a456-426614174000",
							key: "C",
						},
					},
					authenticatedContext,
				),
			).rejects.toThrowError(
				expect.objectContaining({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "key"],
								message: 'Cannot be provided for an agenda item of type "note"',
							},
						],
					},
				}),
			);
		});
	});

	it("should handle folder validation and update authorization", async () => {
		drizzleClientMock.query.usersTable.findFirst.mockResolvedValue({
			role: "regular", // Non-admin user
		});
		drizzleClientMock.query.agendaItemsTable.findFirst.mockResolvedValue({
			type: "general",
			folder: {
				eventId: "event_1",
				event: {
					organization: {
						membershipsWhereOrganization: [
							{ role: "regular" }, // Non-admin role in organization (lines 242-243)
						],
					},
				},
			},
		});

		// Test unauthorized update attempt
		await expect(
			updateAgendaItemResolver(
				{},
				{
					input: {
						id: "123e4567-e89b-12d3-a456-426614174000",
						name: "Updated Name",
					},
				},
				authenticatedContext,
			),
		).rejects.toThrowError(
			expect.objectContaining({
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
});
