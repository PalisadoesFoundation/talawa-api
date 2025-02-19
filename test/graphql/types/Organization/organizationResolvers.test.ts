import { execute, parse } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define your type definitions (schema) and resolvers
const typeDefs = `
  type Query {
    organizationConnectionList(first: Int, skip: Int): [Organization]
  }

  type Organization {
    id: ID!
    name: String!
  }
`;

// Mock resolvers
const resolvers = {
  Query: {
    organizationConnectionList: async (_, { first = 10, skip = 0 }, { drizzleClient }) => {
      // Validate arguments
      if (first < 1 || first > 100) {
        throw new Error('Invalid "first" argument');
      }
      if (skip < 0) {
        throw new Error('Invalid "skip" argument');
      }

      // Fetch data from the mocked database client
      return drizzleClient.query.organizationsTable.findMany({
        limit: first,
        offset: skip,
      });
    },
  },
};

// Create the executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

describe('organizationConnectionList Query', () => {
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

  // Sample organization data
  const sampleOrganizations = [
    { id: 1, name: 'Org 1' },
    { id: 2, name: 'Org 2' },
    { id: 3, name: 'Org 3' },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockContext.drizzleClient.query.organizationsTable.findMany.mockReset();
  });

  const executeQuery = async (query, variables = {}) => {
    return execute({
      schema,
      document: parse(query),
      contextValue: mockContext,
      variableValues: variables,
    });
  };

  it('should return organizations with default pagination values', async () => {
    // Arrange
    mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
      sampleOrganizations
    );

    const query = `
      query {
        organizationConnectionList {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.organizationConnectionList).toEqual(sampleOrganizations);
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany
    ).toHaveBeenCalledWith({
      limit: 10, // default value
      offset: 0, // default value
    });
  });

  it('should return organizations with custom pagination values', async () => {
    // Arrange
    mockContext.drizzleClient.query.organizationsTable.findMany.mockResolvedValue(
      sampleOrganizations
    );

    const query = `
      query($first: Int, $skip: Int) {
        organizationConnectionList(first: $first, skip: $skip) {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query, { first: 5, skip: 10 });

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.organizationConnectionList).toEqual(sampleOrganizations);
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany
    ).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
    });
  });

  it('should throw error when first argument is less than 1', async () => {
    // Arrange
    const query = `
      query {
        organizationConnectionList(first: 0) {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toBe('Invalid "first" argument');
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany
    ).not.toHaveBeenCalled();
  });

  it('should throw error when first argument is greater than 100', async () => {
    // Arrange
    const query = `
      query {
        organizationConnectionList(first: 101) {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toBe('Invalid "first" argument');
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany
    ).not.toHaveBeenCalled();
  });

  it('should throw error when skip argument is negative', async () => {
    // Arrange
    const query = `
      query {
        organizationConnectionList(skip: -1) {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].message).toBe('Invalid "skip" argument');
    expect(
      mockContext.drizzleClient.query.organizationsTable.findMany
    ).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    mockContext.drizzleClient.query.organizationsTable.findMany.mockRejectedValue(
      dbError
    );

    const query = `
      query {
        organizationConnectionList {
          id
          name
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe('Database connection failed');
  });
});
