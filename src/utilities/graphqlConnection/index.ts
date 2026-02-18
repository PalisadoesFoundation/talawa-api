/**
 * GraphQL connection utilities.
 *
 * This module provides utilities for implementing cursor-based pagination
 * following the GraphQL Cursor Connections Specification.
 *
 * Features:
 * - Type-safe connection arguments parsing
 * - Schema validation with Zod
 * - Transformation utilities for nodes to connections
 * - Support for where clauses
 */

// Builder
export { transformToDefaultGraphQLConnection } from "./builder";

// Schemas
export {
	createGraphQLConnectionWithWhereSchema,
	defaultGraphQLConnectionArgumentsSchema,
} from "./schemas";

// Transformers
export {
	transformDefaultGraphQLConnectionArguments,
	transformGraphQLConnectionArgumentsWithWhere,
} from "./transforms";
// Types
export type {
	DefaultGraphQLConnection,
	DefaultGraphQLConnectionEdge,
	DefaultGraphQLConnectionPageInfo,
	ParsedDefaultGraphQLConnectionArguments,
	ParsedDefaultGraphQLConnectionArgumentsWithWhere,
} from "./types";
