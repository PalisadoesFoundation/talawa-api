import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// Mock postgres to prevent actual DB connections
vi.mock("postgres", () => ({
	default: vi.fn(() => ({
		end: vi.fn(),
	})),
}));

// Mock server
vi.mock("~/src/server", () => ({
	server: {
		envConfig: {},
		minio: { client: { putObject: vi.fn() } },
	},
}));

// Mock utilities
vi.mock("~/src/utilities/TalawaGraphQLError", () => ({
	TalawaGraphQLError: class TalawaGraphQLError extends Error {
		extensions: Record<string, unknown>;
		constructor({ extensions }: { extensions: Record<string, unknown> }) {
			super(JSON.stringify(extensions));
			this.extensions = extensions;
		}
	},
}));

vi.mock("~/src/utilities/isNotNullish", () => ({
	isNotNullish: (val: unknown) => val !== null && val !== undefined,
}));

// Hoist mocks to be accessible inside vi.mock
const mocks = vi.hoisted(() => {
	return {
		builder: {
			mutationField: vi.fn(),
			field: vi.fn((args) => args),
			arg: vi.fn(),
			type: vi.fn(),
			required: vi.fn(),
			resolve: vi.fn(),
			objectRef: vi.fn(),
			inputRef: vi.fn(),
			enumType: vi.fn(),
			scalarType: vi.fn(),
			interfaceType: vi.fn(),
			unionType: vi.fn(),
			queryField: vi.fn(),
		},
		drizzle: {
			transaction: vi.fn(),
			query: {
				usersTable: {
					findFirst: vi.fn(),
				},
				tagFoldersTable: {
					findFirst: vi.fn(),
				},
			},
			update: vi.fn(),
		},
		updateChain: {
			set: vi.fn(),
			where: vi.fn(),
			returning: vi.fn(),
		},
	};
});

// Configure Drizzle Mock chain
mocks.drizzle.update.mockReturnValue(mocks.updateChain);
mocks.updateChain.set.mockReturnValue(mocks.updateChain);
mocks.updateChain.where.mockReturnValue(mocks.updateChain);
mocks.updateChain.returning.mockResolvedValue([]);

vi.mock("~/src/graphql/builder", () => ({
	builder: mocks.builder,
}));

vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: mocks.drizzle,
}));

// Mock the TagFolder type to prevent import errors
vi.mock("~/src/graphql/types/TagFolder/TagFolder", () => ({
	TagFolder: "TagFolderType",
}));

// Mock the input type
vi.mock("~/src/graphql/inputs/MutationUpdateTagFolderInput", async () => {
	const { z } = await vi.importActual<typeof import("zod")>("zod");
	return {
		mutationUpdateTagFolderInputSchema: z
			.object({
				id: z.string().uuid(),
				name: z.string().min(1).max(256).optional(),
				parentFolderId: z.string().uuid().nullable().optional(),
			})
			.refine(
				({ id, ...remainingArg }) =>
					Object.values(remainingArg).some((value) => value !== undefined),
				{
					message: "At least one optional argument must be provided.",
				},
			),
		MutationUpdateTagFolderInput: "MutationUpdateTagFolderInput",
	};
});

// Mock drizzle tables
vi.mock("~/src/drizzle/tables/tagFolders", () => ({
	tagFoldersTable: {
		id: "id",
	},
}));

// Mock graphqLimits
vi.mock("~/src/utilities/graphqLimits", () => ({
	default: {
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
	},
}));

// Import the module to register the mutation field
import "~/src/graphql/types/Mutation/updateTagFolder";

describe("Mutation field updateTagFolder", () => {
	let resolver: (
		parent: unknown,
		args: unknown,
		ctx: unknown,
	) => Promise<unknown>;

	beforeAll(() => {
		// Capture the resolver from the builder mock
		const calls = mocks.builder.mutationField.mock.calls;
		const updateTagFolderCall = calls.find(
			(c: unknown[]) => c[0] === "updateTagFolder",
		);
		if (updateTagFolderCall) {
			const fieldDef = updateTagFolderCall[1]({
				field: mocks.builder.field,
				arg: mocks.builder.arg,
			});
			resolver = fieldDef.resolve;
		}
	});

	afterEach(() => {
		vi.clearAllMocks();
		// Reset the update chain
		mocks.drizzle.update.mockReturnValue(mocks.updateChain);
		mocks.updateChain.set.mockReturnValue(mocks.updateChain);
		mocks.updateChain.where.mockReturnValue(mocks.updateChain);
		mocks.updateChain.returning.mockResolvedValue([]);
	});

	it("should be defined", () => {
		expect(resolver).toBeDefined();
	});

	describe("Authentication errors", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const mockContext = {
				currentClient: {
					isAuthenticated: false,
				},
				drizzleClient: mocks.drizzle,
			};

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "Updated Folder Name",
				},
			};

			await expect(resolver(null, args, mockContext)).rejects.toThrow();
		});

		it("should throw unauthenticated error when current user is not found in database", async () => {
			expect.assertions(1);
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: faker.string.uuid() },
				},
				drizzleClient: mocks.drizzle,
			};

			const tagFolderId = faker.string.uuid();

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue(undefined);
			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: faker.string.uuid(),
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [],
				},
			});

			const args = {
				input: {
					id: tagFolderId,
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("unauthenticated");
			}
		});
	});

	describe("Validation errors", () => {
		it("should throw invalid_arguments error for invalid UUID in id field", async () => {
			expect.assertions(1);
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: faker.string.uuid() },
				},
				drizzleClient: mocks.drizzle,
			};

			const args = {
				input: {
					id: "invalid-uuid",
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("invalid_arguments");
			}
		});

		it("should throw invalid_arguments error when no optional argument is provided", async () => {
			expect.assertions(1);
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: faker.string.uuid() },
				},
				drizzleClient: mocks.drizzle,
			};

			const args = {
				input: {
					id: faker.string.uuid(),
					// No name or parentFolderId provided
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("invalid_arguments");
			}
		});

		it("should throw invalid_arguments error for empty name", async () => {
			expect.assertions(1);
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: faker.string.uuid() },
				},
				drizzleClient: mocks.drizzle,
			};

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "", // Empty name should fail validation
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("invalid_arguments");
			}
		});

		it("should throw invalid_arguments error for name exceeding max length", async () => {
			expect.assertions(1);
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: faker.string.uuid() },
				},
				drizzleClient: mocks.drizzle,
			};

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "a".repeat(257), // Exceeds 256 character limit
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("invalid_arguments");
			}
		});
	});

	describe("Resource not found errors", () => {
		it("should throw arguments_associated_resources_not_found error when tag folder does not exist", async () => {
			expect.assertions(2);
			const currentUserId = faker.string.uuid();
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});
			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue(
				undefined,
			);

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("arguments_associated_resources_not_found");
				expect(
					(error as { extensions: { issues: { argumentPath: string[] }[] } })
						.extensions.issues,
				).toEqual([{ argumentPath: ["input", "id"] }]);
			}
		});

		it("should throw arguments_associated_resources_not_found error when parent folder does not exist", async () => {
			expect.assertions(2);
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// First call returns the existing tag folder
			// Second call (for parent folder) returns undefined
			mocks.drizzle.query.tagFoldersTable.findFirst
				.mockResolvedValueOnce({
					organizationId: organizationId,
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				})
				.mockResolvedValueOnce(undefined);

			const args = {
				input: {
					id: faker.string.uuid(),
					parentFolderId: faker.string.uuid(),
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("arguments_associated_resources_not_found");
				expect(
					(error as { extensions: { issues: { argumentPath: string[] }[] } })
						.extensions.issues,
				).toEqual([{ argumentPath: ["input", "parentFolderId"] }]);
			}
		});
	});

	describe("Forbidden action errors", () => {
		it("should throw forbidden_action_on_arguments_associated_resources when parent folder belongs to different organization", async () => {
			expect.assertions(2);
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const differentOrgId = faker.string.uuid();
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// First call returns the existing tag folder
			// Second call returns parent folder with different organization
			mocks.drizzle.query.tagFoldersTable.findFirst
				.mockResolvedValueOnce({
					organizationId: organizationId,
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				})
				.mockResolvedValueOnce({
					organizationId: differentOrgId, // Different organization
				});

			const args = {
				input: {
					id: faker.string.uuid(),
					parentFolderId: faker.string.uuid(),
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("forbidden_action_on_arguments_associated_resources");
				expect(
					(
						error as {
							extensions: {
								issues: { argumentPath: string[]; message: string }[];
							};
						}
					).extensions.issues,
				).toEqual([
					{
						argumentPath: ["input", "parentFolderId"],
						message: "This tag does not belong to the associated organization.",
					},
				]);
			}
		});
	});

	describe("Authorization errors", () => {
		it("should throw unauthorized_action_on_arguments_associated_resources when user is not admin and not org admin", async () => {
			expect.assertions(2);
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "regular", // Not a system administrator
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "regular" }], // Not an org administrator
				},
			});

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("unauthorized_action_on_arguments_associated_resources");
				expect(
					(error as { extensions: { issues: { argumentPath: string[] }[] } })
						.extensions.issues,
				).toEqual([{ argumentPath: ["input", "id"] }]);
			}
		});

		it("should throw unauthorized_action_on_arguments_associated_resources when user is not a member of the organization", async () => {
			expect.assertions(1);
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [], // Not a member
				},
			});

			const args = {
				input: {
					id: faker.string.uuid(),
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("unauthorized_action_on_arguments_associated_resources");
			}
		});
	});

	describe("Successful updates", () => {
		it("should successfully update tag folder name as system administrator", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const newName = "Updated Folder Name";

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [], // No membership needed for system admin
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: newName,
				organizationId: organizationId,
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: currentUserId,
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: newName,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
			expect(mocks.drizzle.update).toHaveBeenCalled();
			expect(mocks.updateChain.set).toHaveBeenCalledWith({
				name: newName,
				parentFolderId: undefined,
				updaterId: currentUserId,
			});
		});

		it("should successfully update tag folder name as organization administrator", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const newName = "Updated Folder Name";

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "regular", // Not a system administrator
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }], // Is org admin
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: newName,
				organizationId: organizationId,
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: newName,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
		});

		it("should successfully update tag folder parentFolderId", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const parentFolderId = faker.string.uuid();

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			// First call returns the existing tag folder
			// Second call returns the parent folder with same organization
			mocks.drizzle.query.tagFoldersTable.findFirst
				.mockResolvedValueOnce({
					organizationId: organizationId,
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				})
				.mockResolvedValueOnce({
					organizationId: organizationId, // Same organization
				});

			const updatedTagFolder = {
				id: tagFolderId,
				name: "Original Name",
				organizationId: organizationId,
				parentFolderId: parentFolderId,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					parentFolderId: parentFolderId,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
			expect(mocks.updateChain.set).toHaveBeenCalledWith({
				name: undefined,
				parentFolderId: parentFolderId,
				updaterId: currentUserId,
			});
		});

		it("should successfully update both name and parentFolderId", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const parentFolderId = faker.string.uuid();
			const newName = "New Folder Name";

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst
				.mockResolvedValueOnce({
					organizationId: organizationId,
					organization: {
						countryCode: "us",
						membershipsWhereOrganization: [{ role: "administrator" }],
					},
				})
				.mockResolvedValueOnce({
					organizationId: organizationId,
				});

			const updatedTagFolder = {
				id: tagFolderId,
				name: newName,
				organizationId: organizationId,
				parentFolderId: parentFolderId,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: newName,
					parentFolderId: parentFolderId,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
			expect(mocks.updateChain.set).toHaveBeenCalledWith({
				name: newName,
				parentFolderId: parentFolderId,
				updaterId: currentUserId,
			});
		});

		it("should successfully update tag folder with null parentFolderId (remove parent)", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: "Folder Name",
				organizationId: organizationId,
				parentFolderId: null, // Parent removed
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					parentFolderId: null, // Explicitly setting to null
					name: "Some Name", // Need at least one optional field
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
			expect(mocks.updateChain.set).toHaveBeenCalledWith({
				name: "Some Name",
				parentFolderId: null,
				updaterId: currentUserId,
			});
		});
	});

	describe("Unexpected errors", () => {
		it("should throw unexpected error when update operation returns empty array", async () => {
			expect.assertions(1);
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			// Simulate update returning empty array (tag folder was deleted externally)
			mocks.updateChain.returning.mockResolvedValue([]);

			const args = {
				input: {
					id: tagFolderId,
					name: "Updated Folder Name",
				},
			};

			try {
				await resolver(null, args, mockContext);
			} catch (error) {
				expect(
					(error as { extensions: { code: string } }).extensions.code,
				).toBe("unexpected");
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle special characters in folder name", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const specialName = "<script>alert('xss')</script>";

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: specialName,
				organizationId: organizationId,
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: specialName,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
		});

		it("should handle unicode characters in folder name", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const unicodeName = "文件夹名称 📁 Папка";

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: unicodeName,
				organizationId: organizationId,
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: unicodeName,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
		});

		it("should handle maximum length folder name (256 characters)", async () => {
			const currentUserId = faker.string.uuid();
			const organizationId = faker.string.uuid();
			const tagFolderId = faker.string.uuid();
			const maxLengthName = "a".repeat(256);

			const mockContext = {
				currentClient: {
					isAuthenticated: true,
					user: { id: currentUserId },
				},
				drizzleClient: mocks.drizzle,
			};

			mocks.drizzle.query.usersTable.findFirst.mockResolvedValue({
				role: "administrator",
			});

			mocks.drizzle.query.tagFoldersTable.findFirst.mockResolvedValue({
				organizationId: organizationId,
				organization: {
					countryCode: "us",
					membershipsWhereOrganization: [{ role: "administrator" }],
				},
			});

			const updatedTagFolder = {
				id: tagFolderId,
				name: maxLengthName,
				organizationId: organizationId,
				parentFolderId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				creatorId: faker.string.uuid(),
				updaterId: currentUserId,
			};

			mocks.updateChain.returning.mockResolvedValue([updatedTagFolder]);

			const args = {
				input: {
					id: tagFolderId,
					name: maxLengthName,
				},
			};

			const result = await resolver(null, args, mockContext);

			expect(result).toEqual(updatedTagFolder);
		});
	});
});
