import { z } from "zod";

/**
 * Zod schema to parse the default graphql connection arguments and transform them to make them easier to work with.
 */
export const defaultGraphQLConnectionArgumentsSchema = z.object({
	after: z
		.string()
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	before: z
		.string()
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	first: z
		.number()
		.min(1)
		.max(32)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
	last: z
		.number()
		.min(1)
		.max(32)
		.nullish()
		.transform((arg) => (arg === null ? undefined : arg)),
});

/**
 * Helper function to create a schema for connection arguments with a where clause.
 * Extends the default connection arguments schema with a custom where schema.
 *
 * @param whereSchema - The Zod schema for the where clause
 * @returns - A Zod schema for connection arguments with the where clause
 */
export const createGraphQLConnectionWithWhereSchema = <T extends z.ZodTypeAny>(
	whereSchema: T,
) => {
	return defaultGraphQLConnectionArgumentsSchema.extend({
		where: (
			whereSchema.nullable().optional() as unknown as z.ZodTypeAny
		).default({}),
	});
};
