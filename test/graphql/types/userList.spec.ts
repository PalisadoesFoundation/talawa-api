import { expect, test, describe, vi, beforeEach } from 'vitest';
import { createTestContext } from '~/src/tests/createTestContext';
import { gql } from 'graphql-tag';
import '../../../src/graphql/types/User/user.queries';
import { mockUsers } from '~/src/tests/mocks/users';

describe('userList Query', () => {
	const testContext = createTestContext();
	let context;

	beforeEach(async () => {
		vi.resetAllMocks();
		context = await testContext.createContext();
		vi.spyOn(context.drizzleClient.query.usersTable, 'findMany');
	});

	const USER_LIST_QUERY = gql`
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
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result.data?.userList).toHaveLength(10);
	});

	test('should return users with custom pagination', async () => {
		// Setup mock return value
		context.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce(mockUsers.slice(5, 10));

		// Execute query with custom pagination
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 5, skip: 5 },
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.usersTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 5,
		});
		expect(result.data?.userList).toHaveLength(5);
	});

	test('should throw error when first is less than 1', async () => {
		// Execute query with invalid first parameter
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 0 },
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	test('should throw error when first exceeds maximum allowed', async () => {
		// Execute query with invalid first parameter
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 101 },
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	test('should throw error when skip is negative', async () => {
		// Execute query with invalid skip parameter
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			variables: { skip: -1 },
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors[0].message).toContain('invalid_arguments');
		expect(context.drizzleClient.query.usersTable.findMany).not.toHaveBeenCalled();
	});

	test('should validate and format error details', async () => {
		// Execute query with multiple invalid parameters
		const result = await testContext.executeOperation({
			query: USER_LIST_QUERY,
			variables: { first: 0, skip: -1 },
			contextValue: context,
		});

		// Assert
		expect(result.errors).toBeDefined();
		expect(result.errors[0].extensions.code).toBe('invalid_arguments');
		expect(result.errors[0].extensions.issues).toBeInstanceOf(Array);
		
		// Check that issues contain proper format with argumentPath and message
		const issues = result.errors[0].extensions.issues;
		expect(issues.some(issue => issue.argumentPath.includes('first') && issue.message)).toBeTruthy();
		expect(issues.some(issue => issue.argumentPath.includes('skip') && issue.message)).toBeTruthy();
	});
});
