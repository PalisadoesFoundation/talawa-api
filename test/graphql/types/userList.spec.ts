// test/graphql/types/userList.spec.ts
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { execute } from 'graphql';
import { schema } from '~/src/graphql/schema';
import { TalawaGraphQLError } from '~/src/utilities/TalawaGraphQLError';

describe('userList Query', () => {
	// Mock users data
	const mockUsers = [
		{ _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', createdAt: new Date(), updatedAt: new Date() },
		{ _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', createdAt: new Date(), updatedAt: new Date() },
		{ _id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', createdAt: new Date(), updatedAt: new Date() },
	];
	
	// Type definition for context
	type TestContext = {
		drizzleClient: {
			query: {
				usersTable: {
					findMany: jest.Mock;
				};
			};
		};
	};
	
	let context: TestContext;
	
	beforeEach(async () => {
		vi.resetAllMocks();
		// Create typed context with mocked database methods
		context = {
			drizzleClient: {
				query: {
					usersTable: {
						findMany: vi.fn(),
					},
				},
			},
		};
	});
	
	// Helper function to execute operations with proper typing
	const executeOperation = async ({ query, variables = {} }: { query: string; variables?: Record<string, any> }) => {
		return execute({
			schema,
			document: { kind: 'Document', definitions: [] } as any, // This will be replaced by the actual parsed query
			variableValues: variables,
			contextValue: context,
		});
	};
	
	const USER_LIST_QUERY = `
		query UserList($first: Int, $skip: Int) {
			userList(first: $first, skip: $skip) {
				_id
				firstName
				lastName
				email
				createdAt
				updatedAt
			}
		}
	`;
	
	test('should return users with default pagination', async () => {
		// Setup mock return value
		context.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce(mockUsers.slice(0, 10));
		
		// Execute query without arguments
		const result = await executeOperation({
			query: USER_LIST_QUERY,
		});
		
		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result.data?.userList).toHaveLength(3);
	});
	
	test('should return users with custom pagination', async () => {
		// Setup mock return value
		context.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce(mockUsers.slice(1, 3));
		
		// Execute query with custom pagination
		const result = await executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 5, skip: 5 },
		});
		
		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 5,
		});
		expect(result.data?.userList).toHaveLength(2);
	});
	
	test('should throw error when first is less than 1', async () => {
		// Execute query with invalid first parameter
		const result = await executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 0 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should throw error when first exceeds maximum allowed', async () => {
		// Execute query with invalid first parameter
		const result = await executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 101 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should throw error when skip is negative', async () => {
		// Execute query with invalid skip parameter
		const result = await executeOperation({
			query: USER_LIST_QUERY,
			variables: { skip: -1 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors?.[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should validate and format error details', async () => {
		// Execute query with multiple invalid parameters
		const result = await executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 0, skip: -1 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		
		if (result.errors && result.errors[0].extensions) {
			expect(result.errors[0].extensions.code).toBe('invalid_arguments');
			expect(Array.isArray(result.errors[0].extensions.issues)).toBe(true);
			
			// Check that issues contain proper format with argumentPath and message
			const issues = result.errors[0].extensions.issues as Array<{ argumentPath: string[], message: string }>;
			expect(issues.some(issue => issue.argumentPath.includes('first') && issue.message)).toBeTruthy();
			expect(issues.some(issue => issue.argumentPath.includes('skip') && issue.message)).toBeTruthy();
		}
	});
});
