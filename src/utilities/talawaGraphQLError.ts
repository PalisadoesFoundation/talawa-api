import {
	GraphQLError,
	type GraphQLErrorOptions,
	type GraphQLFormattedError,
} from "graphql";

//The term action used below is used to refer to read and write operations triggered by the clients. In the context of graphql query, mutation and subscription are the three possible ways to perform these actions.

// The term resource used below is used to refer to any entity that the client can perform an action on. These can be both coarse and fine grained entities. One example for a coarse grained entity would be the account of a user and one example for a fine grained entity would be the email address of a user.

/**
 * When resources associated to the provided graphql arguments cannot be not found.
 *
 * @example
 *	throw new TalawaGraphQLError("No posts found for some of the provided arguments.", {
 *		code: "arguments_associated_resources_not_found"
 *		issues: [
 *			{
 * 				argumentPath: ["input", 0, "id"],
 * 			},
 * 			{
 * 				argumentPath: ["input", 3, "id"],
 * 			},
 * 			{
 * 				argumentPath: ["input", 19, "id"],
 * 			},
 *		],
 *	});
 */
export type ArgumentsAssociatedResourcesNotFoundExtensions = {
	code: "arguments_associated_resources_not_found";
	issues: {
		argumentPath: (string | number)[];
	}[];
};

/**
 * When the client tries to perform an action that conflicts with real world expectations of the application.
 *
 * @example
 * throw new TalawaGraphQLError("You can only claim your yearly award once per year.",
 * {
 *  code: "forbidden_action"
 * })
 */
export type ForbiddenActionExtensions = {
	code: "forbidden_action";
};

/**
 * When the client tries to perform actions on resources associated to arguments that conflict with real world expectations of the application. One example would be a user trying to follow their own account on a social media application.
 *
 * @example
 *	throw new TalawaGraphQLError({
 *      extensions: {
 *          code: "forbidden_action_on_arguments_associated_resources",
 *          issues: [
 *              {
 *                  argumentPath: ["input", 0, "emailAddress"],
 *                  message: "This email address is not available.",
 *              },
 *              {
 *                  argumentPath: ["input", 3, "username"],
 *                  message: "This username is not available.",
 *              },
 *          ],
 *      },
 * 		message: "This action is forbidden on the resources associated to the provided arguments."
 *	});
 */
export type ForbiddenActionOnArgumentsAssociatedResourcesExtensions = {
	code: "forbidden_action_on_arguments_associated_resources";
	issues: {
		argumentPath: (string | number)[];
		message: string;
	}[];
};

/**
 * When the client must be authenticated to perform an action.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "unauthenticated"
 *  },
 * 	message: "Only authenticated users can perform this action.",
 * })
 */
export type UnauthenticatedExtensions = {
	code: "unauthenticated";
};

/**
 * When the client provides invalid arguments in a graphql operation.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "invalid_arguments",
 *      issues: [
 *          {
 *              argumentPath: ["input", "age"],
 *              message: "Must be greater than 18."
 *          },
 *          {
 *              argumentPath: ["input", "username"],
 *              message: "Must be smaller than or equal to 25 characters."
 *          },
 *          {
 *              argumentPath: ["input", "favoriteFood", 2],
 *              message: "Must be at least 1 character long."
 *          },
 *      ],
 *  },
 *  message: "Invalid arguments provided.",
 * })
 */
export type InvalidArgumentsExtensions = {
	code: "invalid_arguments";
	issues: {
		argumentPath: (string | number)[];
		message: string;
	}[];
};

/**
 * When the client is not authorized to perform an action.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "unauthorized_action"
 *  },
 *  message: "You are not authorized to perform this action."
 * })
 */
export type UnauthorizedActionExtensions = {
	code: "unauthorized_action";
};

/**
 * When the client is not authorized to perform an action on a resource associated to an argument.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "unauthorized_action_on_arguments_associated_resources",
 *      issues: [
 *          {
 *              argumentPath: ["input", "id"],
 *              message: "You must be an approved member of this organization to access it.",
 *          },
 *      ],
 *  },
 *  message: "You are not authorized to perform this action on the resources associated to the provided arguments."
 * })
 */
export type UnauthorizedActionOnArgumentsAssociatedResourcesExtensions = {
	issues: {
		argumentPath: (string | number)[];
	}[];
	code: "unauthorized_action_on_arguments_associated_resources";
};

/**
 * When the client is not authorized to perform an action with certain arguments.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "unauthorized_arguments",
 *      issues: [
 *          {
 *              argumentPath: ["input", "role"],
 *              message: "You are not authorzied to change your user role.",
 *          },
 *      ],
 *  },
 *  message: "You are not authorized to perform this action with the provided arguments."
 * })
 */
export type UnauthorizedArgumentsExtensions = {
	issues: {
		argumentPath: (string | number)[];
	}[];
	code: "unauthorized_arguments";
};

/**
 * When an error that doesn't fit one of the error types listed above occurs. One example would be a database request failure.
 *
 * @example
 * throw new TalawaGraphQLError({
 *  extensions: {
 *      code: "unexpected"
 *  },
 *  message: "Something went wrong. Please try again later.",
 * })
 */
export type UnexpectedExtensions = {
	code: "unexpected";
};

export type TalawaGraphQLErrorExtensions =
	| ArgumentsAssociatedResourcesNotFoundExtensions
	| ForbiddenActionExtensions
	| ForbiddenActionOnArgumentsAssociatedResourcesExtensions
	| UnauthenticatedExtensions
	| InvalidArgumentsExtensions
	| UnauthorizedActionExtensions
	| UnauthorizedActionOnArgumentsAssociatedResourcesExtensions
	| UnauthorizedArgumentsExtensions
	| UnexpectedExtensions;

/**
 * This class extends the `GraphQLError` class and is used to create graphql error instances with strict typescript assertion on providing the error metadata within the `extensions` field. This assertion prevents talawa api contributers from returning arbitrary, undocumented errors to the talawa api graphql clients.
 *
 * This also standardizes the errors that the client developers using talawa api can expect in the graphql responses, helping them design better UI experiences for end users. If necessary, the localization of the error messages(i18n) can be done within the graphql resolvers where this function is used.
 *
 * The following example shows the usage of `createTalawaGraphQLError` function within a graphql resolver for resolving the user record of the best friend of a user:
 * @example
 * export const user = async (parent, args, ctx) => {
 *  const existingUser = await ctx.drizzleClient.query.user.findFirst({
 *      where: (fields, operators) => operators.eq(fields.id, args.input.id),
 *  });
 *
 *	if (user === undefined) {
 *		throw new TalawaGraphQLError({
 *			extensions: {
 *				code: "arguments_associated_resources_not_found",
 * 				issues: [
 * 					{
 * 						argumentPath: ["input", "id"],
 * 					},
 * 				],
 *			},
 * 			message: "No associated resources found for the provided arguments.",
 *      })
 *	}
 *
 *  return user;
 * }
 */
export class TalawaGraphQLError extends GraphQLError {
	constructor({
		message,
		...options
	}: GraphQLErrorOptions & {
		extensions: TalawaGraphQLErrorExtensions;
		message: string;
	}) {
		super(message, options);
	}
}

/**
 * Type of the error returned by talawa api's graphql implementation in the root "errors" field of the graphql responses.
 */
export type TalawaGraphQLFormattedError = GraphQLFormattedError & {
	extensions: TalawaGraphQLErrorExtensions;
};
