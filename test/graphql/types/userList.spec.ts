import { type GraphQLSchema, execute, parse } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";

// Mock data
const mockUsers = [
  { id: 1, name: "User 1", email: "user1@example.com" },
  { id: 2, name: "User 2", email: "user2@example.com" },
  { id: 3, name: "User 3", email: "user3@example.com" },
];

// Mock context
const mockContext = {
  drizzleClient: { query: { usersTable: { findMany: vi.fn() } } },
};

describe("userList Query", () => {
  let schema: GraphQLSchema;

  beforeEach(() => {
    vi.clearAllMocks();
    schema = builder.toSchema({});
    mockContext.drizzleClient.query.usersTable.findMany.mockReset();
  });

  const executeOperation = async (variables?: {
    first?: number;
    skip?: number;
  }) => {
    const query = `
      query UserList($first: Int, $skip: Int) {
        userList(first: $first, skip: $skip) {
          id
          name
          email
        }
      }
    `;

    return execute({
      schema,
      document: parse(query),
      contextValue: mockContext,
      variableValues: variables,
    });
  };

  it("should return users with default pagination values", async () => {
    // Arrange
    mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(
      mockUsers,
    );

    // Act
    const result = await executeOperation();

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.userList).toEqual(mockUsers);
    expect(
      mockContext.drizzleClient.query.usersTable.findMany,
    ).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
    });
  });

  it("should return users with custom pagination values", async () => {
    // Arrange
    mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(
      mockUsers,
    );

    // Act
    const result = await executeOperation({ first: 20, skip: 5 });

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.userList).toEqual(mockUsers);
    expect(
      mockContext.drizzleClient.query.usersTable.findMany,
    ).toHaveBeenCalledWith({
      limit: 20,
      offset: 5,
    });
  });

  it("should throw an error when first is less than 1", async () => {
    // Act
    const result = await executeOperation({ first: 0 });

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: "invalid_arguments",
        issues: expect.arrayContaining([
          expect.objectContaining({ argumentPath: ["first"] }),
        ]),
      },
    });
    expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    // Arrange
    const dbError = new Error("Database connection failed");
    mockContext.drizzleClient.query.usersTable.findMany.mockRejectedValue(dbError);

    // Act
    const result = await executeOperation();

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe("Database connection failed");
  });
});
