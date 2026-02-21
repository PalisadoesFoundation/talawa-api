import { z } from "zod";
import { TalawaGraphQLError } from "./TalawaGraphQLError";
import { ErrorCode } from "./errors/errorCodes";

/**
 * Validation wrapper utility for GraphQL resolvers
 * Provides consistent validation and error handling
 */

export interface ValidationOptions<TInput = unknown, TResult = unknown> {
	// Zod schema for input validation
	schema?: z.ZodSchema<TInput>;
	// Custom validation function
	validate?: (input: TInput, ctx: any) => Promise<void> | void;
	// Transform function to process validated input
	transform?: (input: TInput) => Promise<TResult> | TResult;
}

/**
 * Higher-order function that wraps resolvers with validation logic
 * @param options - Validation configuration
 * @param resolver - The actual resolver function
 * @returns Wrapped resolver with validation
 */
export function withValidation<TArgs = unknown, TResult = unknown, TParent = unknown>(
	options: ValidationOptions<TArgs, TResult>,
	resolver: (parent: TParent, args: TArgs, ctx: any) => Promise<TResult>,
) {
	return async (parent: TParent, args: TArgs, ctx: any): Promise<TResult> => {
		try {
			// Input validation using Zod schema if provided
			if (options.schema) {
				const result = await options.schema.parseAsync(args);
				args = result as TArgs;
			}

			// Custom validation function if provided
			if (options.validate) {
				await options.validate(args, ctx);
			}

			// Transform input if transform function provided
			let processedArgs: any = args;
			if (options.transform) {
				processedArgs = await options.transform(args);
			}

			// Call the actual resolver
			return await resolver(parent, processedArgs, ctx);
		} catch (error) {
			// Handle Zod validation errors
			if (error instanceof z.ZodError) {
				const errorMessages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
				throw new TalawaGraphQLError({
					message: `Validation failed: ${errorMessages.join(', ')}`,
					extensions: {
						code: ErrorCode.INVALID_INPUT,
						validationErrors: error.issues,
					},
				});
			}

			// Re-throw TalawaGraphQLError as-is
			if (error instanceof TalawaGraphQLError) {
				throw error;
			}

			// Handle other errors
			throw new TalawaGraphQLError({
				message: error instanceof Error ? error.message : "Unknown validation error",
				extensions: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
				},
			});
		}
	};
}

/**
 * Convenience function for basic input validation with Zod schema
 */
export function validateInput<T>(
	schema: z.ZodSchema<T>,
	resolver: (parent: any, args: T, ctx: any) => Promise<any>,
) {
	return withValidation({ schema }, resolver);
}

/**
 * Convenience function for custom validation logic
 */
export function validateCustom<TArgs = unknown>(
	validateFn: (input: TArgs, ctx: any) => Promise<void> | void,
	resolver: (parent: any, args: TArgs, ctx: any) => Promise<any>,
) {
	return withValidation({ validate: validateFn }, resolver);
}
