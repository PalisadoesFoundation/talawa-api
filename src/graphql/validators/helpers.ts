import type { z } from "zod";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * GraphQL validation helpers that integrate Zod with the Talawa error handling system.
 */

/**
 * Validates data against a Zod schema and throws a TalawaGraphQLError if validation fails.
 *
 * This helper eliminates boilerplate validation code in GraphQL resolvers by:
 * 1. Running async validation with Zod's safeParseAsync
 * 2. Mapping Zod validation errors to TalawaGraphQLError with the `invalid_arguments` code
 * 3. Formatting error issues with argumentPath and message for client consumption
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate (typically resolver args)
 * @returns The parsed and validated data with TypeScript type inference
 * @throws TalawaGraphQLError When validation fails, with code "invalid_arguments"
 *
 * @example
 * ```ts
 * // In a GraphQL resolver
 * import { zParseOrThrow } from "~/src/graphql/validators/helpers";
 * import { createPostInput } from "~/src/graphql/validators/core";
 *
 * const mutationCreatePostArgumentsSchema = z.object({
 *   input: createPostInput,
 * });
 *
 * export const Mutation_createPost = {
 *   resolve: async (_parent, args, ctx) => {
 *     const parsedArgs = await zParseOrThrow(
 *       mutationCreatePostArgumentsSchema,
 *       args
 *     );
 *
 *     // parsedArgs is now typed and validated
 *     // ...rest of resolver logic
 *   },
 * };
 * ```
 *
 * @example
 * ```ts
 * // Error handling example
 * try {
 *   const data = await zParseOrThrow(schema, userInput);
 * } catch (error) {
 *   // error is a TalawaGraphQLError with:
 *   // {
 *   //   extensions: {
 *   //     code: "invalid_arguments",
 *   //     issues: [
 *   //       { argumentPath: ["input", "title"], message: "Title too long" }
 *   //     ]
 *   //   }
 *   // }
 * }
 * ```
 */
export async function zParseOrThrow<TSchema extends z.ZodTypeAny>(
	schema: TSchema,
	data: unknown,
): Promise<z.infer<TSchema>> {
	const res = await schema.safeParseAsync(data);
	if (!res.success) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "invalid_arguments",
				issues: res.error.issues.map((issue) => ({
					argumentPath: issue.path,
					message: issue.message,
				})),
			},
		});
	}
	return res.data;
}
