import { z } from "zod";

/**
 * Type of the object containing the parsed default arguments of a graphql connection.
 */
export type ParsedDefaultGraphQLConnectionArguments<Cursor = string> = {
	/**
	 *
	 */
	cursor?: Cursor | undefined;
	/**
	 * The amount of graphql connection edges to return in a single graphql connection operation.
	 */
	limit: number;
	/**
	 * This field is used to identify whether the client wants to traverse the graphql connection edges in the default order or in the inversed order.
	 *
	 * @example
	 * An example would be scrolling on twitter's home page(assuming they're using graphql connections for fetching array-like data). When scrolling down, the graphql connection traversal is the default and when scrolling up, the graphql connection traversal is inversed.
	 */
	isInversed: boolean;
};

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
 * This is typescript type of a base graphql connection edge object. This connection edge object can be extended to create a custom connection edge object as long as the new connection edge object adheres to the default type of this base connection edge object.
 */
export type DefaultGraphQLConnectionEdge<NodeType> = {
	cursor: string;
	node: NodeType;
};

/**
 * This is typescript type of a base graphql connection page info object. This connection page info object can be extended to create a custom connnection page info object as long as the new connection object adheres to the default type of this base connection object.
 */
export type DefaultGraphQLConnectionPageInfo = {
	endCursor: string | null;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startCursor: string | null;
};

/**
 * This is typescript type of a base graphql connection object. This connection object can be extended to create a custom connnection object as long as the new connection object adheres to the default type of this base connection object.
 */
export type DefaultGraphQLConnection<NodeType> = {
	edges: DefaultGraphQLConnectionEdge<NodeType>[];
	pageInfo: DefaultGraphQLConnectionPageInfo;
};

/**
 * This function is used to transform an array of objects to a standard graphql connection object.
 *
 * @remarks
 * The logic used in this function is common to almost all graphql connection creation flows, abstracting that away into this function lets developers use a declarative way to create the graphql connection object they want and prevent code duplication.
 *
 * @example
 *
 *	const orderBy = parsedArgs.isInverted ? asc(fields.id) : desc(fields.id);
 * let where;
 *
 * if (parsedArgs.isInverted) {
 * 	if (parsedArgs.cursor !== undefined) {
 * 		where = and(eq(usersTable.id, parsedArgs.cursor), lt(usersTable.id, parsedArgs.cursor));
 * 	}
 * } else {
 * 	if (parsedArgs.cursor !== undefined) {
 * 		where = and(eq(usersTable.id, parsedArgs.cursor), gt(usersTable.id, parsedArgs.cursor));
 * 	}
 * }
 *
 * const users = await drizzleClient.usersTable.findMany({
 * 	limit: parsedArgs.limit,
 * 	orderBy,
 * 	where,
 * })
 *
 * const usersConnection = transformToDefaultGraphQLConnection({
 * 	createCursor: (rawNode) => rawNode.id,
 * 	createNode: (rawNode) => rawNode,
 * 	parsedArgs,
 * 	rawNodes: users,
 * });
 */
export const transformToDefaultGraphQLConnection = <
	RawNode,
	Node = RawNode,
	Cursor = string,
>({
	createCursor,
	createNode,
	parsedArgs: { cursor, isInversed, limit },
	rawNodes,
}: {
	createCursor: (rawNode: RawNode) => string;
	createNode: (rawNode: RawNode) => Node;
	parsedArgs: ParsedDefaultGraphQLConnectionArguments<Cursor>;
	rawNodes: RawNode[];
}): DefaultGraphQLConnection<Node> => {
	const connection: DefaultGraphQLConnection<Node> = {
		edges: [],
		pageInfo: {
			endCursor: null,
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: null,
		},
	};

	// If the arguments `before` and `last` are used.
	if (isInversed) {
		if (rawNodes.length === limit) {
			connection.pageInfo.hasPreviousPage = true;
			// Remove the extra fetched node.
			rawNodes.shift();
		} else {
			connection.pageInfo.hasPreviousPage = false;
		}

		// If the cursor is `undefined` it means that the connection is at the very beginning and there are no edges after it.
		connection.pageInfo.hasNextPage = cursor !== undefined;

		for (const rawNode of rawNodes.reverse()) {
			connection.edges.push({
				cursor: createCursor(rawNode),
				node: createNode(rawNode),
			});
		}
	}
	// If the arguments `after` and `first` are used.
	else {
		if (rawNodes.length === limit) {
			connection.pageInfo.hasNextPage = true;
			// Remove the extra fetched node.
			rawNodes.pop();
		} else {
			connection.pageInfo.hasNextPage = false;
		}

		// If the cursor is `undefined` it means that the connection is at the very beginning and there are no edges before it.
		connection.pageInfo.hasPreviousPage = cursor !== undefined;

		for (const rawNode of rawNodes) {
			connection.edges.push({
				cursor: createCursor(rawNode),
				node: createNode(rawNode),
			});
		}
	}

	const endCursor = connection.edges[0]?.cursor;
	const startCursor = connection.edges[connection.edges.length - 1]?.cursor;
	connection.pageInfo.endCursor = endCursor !== undefined ? endCursor : null;
	connection.pageInfo.startCursor =
		startCursor !== undefined ? startCursor : null;

	return connection;
};
