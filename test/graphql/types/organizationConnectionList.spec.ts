// test/graphql/types/organizationConnectionList.spec.ts
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { execute } from 'graphql';
import { schema } from '~/src/graphql/schema';

describe('organizationConnectionList Query', () => {
	// Mock organizations data
	const mockOrganizations = [
		{ _id: '1', name: 'Org 1', description: 'Description 1', isPublic: true, createdAt: new Date(), updatedAt: new Date() },
		{ _id: '2', name: 'Org 2', description: 'Description 2', isPublic: false, createdAt: new Date(), updatedAt: new Date() },
		{ _id: '3', name: 'Org 3', description: 'Description 3', isPublic: true, createdAt: new Date(), updatedAt: new Date() },
	];
	
	// Type definition for context
	type TestContext = {
		drizzleClient: {
			query: {
				organizationsTable: {
					findMany: ReturnType<typeof vi.fn>;
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
					organizationsTable: {
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
	
	const ORGANIZATION_CONNECTION_LIST_QUERY = `
		query OrganizationConnectionList($first: Int, $skip: Int) {
			organizationConnectionList(first: $first, skip: $skip) {
				_id
				name
				description
				isPublic
				createdAt
				updatedAt
			}
		}
	`;
	
	test('should return organizations with default pagination', async () => {
		// Setup mock return value
		context.drizzleClient.query.organizationsTable.findMany.mockResolvedValueOnce(mockOrganizations.slice(0, 10));
		
		// Execute query without arguments
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
		});
		
		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
		expect(result.data?.organizationConnectionList).toHaveLength(3);
	});
	
	test('should return organizations with custom pagination', async () => {
		// Setup mock return value
		context.drizzleClient.query.organizationsTable.findMany.mockResolvedValueOnce(mockOrganizations.slice(1, 3));
		
		// Execute query with custom pagination
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
			variables: { first: 5, skip: 5 },
		});
		
		// Assert
		expect(result.errors).toBeUndefined();
		expect(context.drizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 5,
			offset: 5,
		});
		expect(result.data?.organizationConnectionList).toHaveLength(2);
	});
	
	test('should throw error when first is less than 1', async () => {
		// Execute query with invalid first parameter
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
			variables: { first: 0 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		if (result.errors && result.errors.length > 0) {
			expect(result.errors[0].message).toContain('invalid_arguments');
		} else {
			fail('Expected errors to be defined');
		}
		expect(context.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should throw error when first exceeds maximum allowed', async () => {
		// Execute query with invalid first parameter
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
			variables: { first: 101 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		if (result.errors && result.errors.length > 0) {
			expect(result.errors[0].message).toContain('invalid_arguments');
		} else {
			fail('Expected errors to be defined');
		}
		expect(context.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should throw error when skip is negative', async () => {
		// Execute query with invalid skip parameter
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
			variables: { skip: -1 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		if (result.errors && result.errors.length > 0) {
			expect(result.errors[0].message).toContain('invalid_arguments');
		} else {
			fail('Expected errors to be defined');
		}
		expect(context.drizzleClient.query.organizationsTable.findMany).not.toHaveBeenCalled();
	});
	
	test('should validate and format error details', async () => {
		// Execute query with multiple invalid parameters
		const result = await executeOperation({
			query: ORGANIZATION_CONNECTION_LIST_QUERY,
			variables: { first: 0, skip: -1 },
		});
		
		// Assert
		expect(result.errors).toBeDefined();
		
		if (result.errors && result.errors.length > 0 && result.errors[0].extensions) {
			expect(result.errors[0].extensions.code).toBe('invalid_arguments');
			expect(Array.isArray(result.errors[0].extensions.issues)).toBe(true);
			
			// Check that issues contain proper format with argumentPath and message
			const issues = result.errors[0].extensions.issues as Array<{ argumentPath: string[], message: string }>;
			expect(issues.some(issue => issue.argumentPath.includes('first') && issue.message)).toBeTruthy();
			expect(issues.some(issue => issue.argumentPath.includes('skip') && issue.message)).toBeTruthy();
		} else {
			fail('Expected errors with extensions to be defined');
		}
	});
});
