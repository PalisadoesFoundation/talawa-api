import { execute, parse } from 'graphql';
import { schema } from '~/src/graphql/schema';
import { beforeEach, describe, expect, it, vi } from 'vitest';
describe('userList Query', () => {
  // Mock context
  const mockContext = {
    drizzleClient: {
      query: {
        usersTable: {
          findMany: vi.fn(),
        },
      },
    },
  };

  // Sample user data
  const sampleUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockContext.drizzleClient.query.usersTable.findMany.mockReset();
  });

  const executeQuery = async (query: string, variables = {}) => {
    return execute({
      schema,
      document: parse(query),
      contextValue: mockContext,
      variableValues: variables,
    });
  };

  it('should return users with default pagination values', async () => {
    // Arrange
    mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(sampleUsers);
    
    const query = `
      query {
        userList {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.userList).toEqual(sampleUsers);
    expect(mockContext.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
      limit: 10,  // default value
      offset: 0,  // default value
    });
  });

  it('should return users with custom pagination values', async () => {
    // Arrange
    mockContext.drizzleClient.query.usersTable.findMany.mockResolvedValue(sampleUsers);
    
    const query = `
      query($first: Int, $skip: Int) {
        userList(first: $first, skip: $skip) {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query, { first: 5, skip: 10 });

    // Assert
    expect(result.errors).toBeUndefined();
    expect(result.data?.userList).toEqual(sampleUsers);
    expect(mockContext.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
      limit: 5,
      offset: 10,
    });
  });

  it('should throw error when first argument is less than 1', async () => {
    // Arrange
    const query = `
      query {
        userList(first: 0) {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: 'invalid_arguments',
      },
    });
    expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
  });

  it('should throw error when first argument is greater than 100', async () => {
    // Arrange
    const query = `
      query {
        userList(first: 101) {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: 'invalid_arguments',
      },
    });
    expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
  });

  it('should throw error when skip argument is negative', async () => {
    // Arrange
    const query = `
      query {
        userList(skip: -1) {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: 'invalid_arguments',
      },
    });
    expect(mockContext.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const dbError = new Error('Database connection failed');
    mockContext.drizzleClient.query.usersTable.findMany.mockRejectedValue(dbError);

    const query = `
      query {
        userList {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toBe('Database connection failed');
  });

  it('should verify error object structure when validation fails', async () => {
    // Arrange
    const query = `
      query {
        userList(first: 0, skip: -1) {
          id
          name
          email
        }
      }
    `;

    // Act
    const result = await executeQuery(query);

    // Assert
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toMatchObject({
      extensions: {
        code: 'invalid_arguments',
        issues: expect.arrayContaining([
          expect.objectContaining({
            argumentPath: expect.any(Array),
            message: expect.any(String),
          }),
        ]),
      },
    });
  });
});
