import { type GraphQLSchema, execute, parse } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { builder } from "~/src/graphql/builder";

// Mock data
const mockOrganizations = [
  { id: 1, name: "Org 1" },
  { id: 2, name: "Org 2" },
  { id: 3, name: "Org 3" },
];

// Mock context
const mockContext = {
  drizzleClient: {
    query: {
      organizationsTable: {
        findMany: vi.fn(),
      },
    },
  },
};

describe("organizationConnectionList Query", () => {
  let schema: GraphQLSchema;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext.drizzleClient.query.organizationsTable.findMany.mockReset();
    schema = builder.toSchema({});
  });

  const executeOperation = async (variables?: {
    first?: number;
    skip?: number;
  }) => {
    const query = `
      query OrganizationConnectionList($first: Int, $skip: Int) {
        organizationConnectionList(first: $first, skip: $skip) {
          id
          name
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

  it("should return organizations with default pagination values", async () => {
    // Arrange
    mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
      mockOrganizations,
    );

    // Act
    const result = await executeOperation();

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.organizationConnectionList).toEqual(mockOrganizations);
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany,
    ).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
    });
  });

  it("should return organizations with custom pagination values", async () => {
    // Arrange
    mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
      mockOrganizations,
    );

    // Act
    const result = await executeOperation({ first: 20, skip: 5 });

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.organizationConnectionList).toEqual(mockOrganizations);
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany,
    ).toHaveBeenCalledWith({
      limit: 20,
      offset: 5,
    });
  });

  it("should throw error when first is less than 1", async () => {
    // Act
    const result = await executeOperation({ first: 0 });

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: "invalid_arguments",
        issues: expect.arrayContaining([
          expect.objectContaining({
            argumentPath: ["first"],
          }),
        ]),
      },
    });
    expect(mockContext.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
  });

  it("should handle database errors gracefully", async () => {
    // Arrange
    const dbError = new Error("Database connection failed");
    mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(dbError);

    // Act
    const result = await executeOperation();

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.originalError).toBe(dbError);
  });
});
