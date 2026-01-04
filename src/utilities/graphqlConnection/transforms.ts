import type { z } from "zod";
import type { defaultGraphQLConnectionArgumentsSchema } from "./schemas";
import type { ParsedDefaultGraphQLConnectionArguments } from "./types";

/**
 * Transform function for the basic connection arguments.
 */
export const transformDefaultGraphQLConnectionArguments = <
	Arg extends z.infer<typeof defaultGraphQLConnectionArgumentsSchema>,
>(
	arg: Arg,
	ctx: z.RefinementCtx,
) => {
	const transformedArg: ParsedDefaultGraphQLConnectionArguments = {
		cursor: undefined,
		isInversed: false,
		limit: 0,
	};

	const { after, before, first, last, ...customArg } = arg;

	if (first !== undefined) {
		if (last !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "last" cannot be provided with argument "first".`,
				path: ["last"],
			});
		}

		if (before !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "before" cannot be provided with argument "first".`,
				path: ["before"],
			});
		}

		transformedArg.isInversed = false;
		// The limit is increased by 1 to check for the existence of next connection edge by fetching one additional raw node in the connection resolver and providing this information in the field `hasNextPage` of the connection object's `pageInfo` field.
		transformedArg.limit = first + 1;

		if (after !== undefined) {
			transformedArg.cursor = after;
		}
	} else if (last !== undefined) {
		if (after !== undefined) {
			ctx.addIssue({
				code: "custom",
				message: `Argument "after" cannot be provided with argument "last".`,
				path: ["after"],
			});
		}

		transformedArg.isInversed = true;
		// The limit is increased by 1 to check for the existence of previous connection edge by fetching one additional raw node in the connection resolver and providing this information in the field `hasPreviousPage` of the connection object's `pageInfo` field.
		transformedArg.limit = last + 1;

		if (before !== undefined) {
			transformedArg.cursor = before;
		}
	} else {
		ctx.addIssue({
			code: "custom",
			message: `A non-null value for argument "first" must be provided.`,
			path: ["first"],
		});
		ctx.addIssue({
			code: "custom",
			message: `A non-null value for argument "last" must be provided.`,
			path: ["last"],
		});
	}

	return {
		...transformedArg,
		...customArg,
	};
};

/**
 * Transform function for connection arguments with a where clause.
 * Extends the base transformation with where handling.
 *
 * @param arg - The arguments to transform
 * @param ctx - The Zod refinement context
 * @returns - The transformed arguments with where clause
 */
export const transformGraphQLConnectionArgumentsWithWhere = <
	Arg extends z.infer<typeof defaultGraphQLConnectionArgumentsSchema> & {
		where: unknown;
	},
	_Where = Arg["where"],
>(
	arg: Arg,
	ctx: z.RefinementCtx,
) => {
	// First transform the connection arguments without where
	const { where, ...connectionArgs } = arg;
	const transformedConnectionArgs = transformDefaultGraphQLConnectionArguments(
		connectionArgs as Arg,
		ctx,
	);

	// Now add the where clause to the result
	return {
		...transformedConnectionArgs,
		where,
	};
};
