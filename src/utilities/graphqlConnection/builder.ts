import type {
	DefaultGraphQLConnection,
	ParsedDefaultGraphQLConnectionArguments,
} from "./types";

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
	createCursor: (rawNode: RawNode) => Cursor;
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
			rawNodes.pop();
		} else {
			connection.pageInfo.hasPreviousPage = false;
		}

		// If the cursor is `undefined` it means that the connection is at the very beginning and there are no edges after it.
		connection.pageInfo.hasNextPage = cursor !== undefined;

		for (const rawNode of rawNodes.reverse()) {
			const decodedCursor = createCursor(rawNode);
			const encodedCursor = Buffer.from(JSON.stringify(decodedCursor)).toString(
				"base64url",
			);

			connection.edges.push({
				cursor: encodedCursor,
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
			const decodedCursor = createCursor(rawNode);
			const encodedCursor = Buffer.from(JSON.stringify(decodedCursor)).toString(
				"base64url",
			);

			connection.edges.push({
				cursor: encodedCursor,
				node: createNode(rawNode),
			});
		}
	}

	const startCursor = connection.edges[0]?.cursor;
	const endCursor = connection.edges[connection.edges.length - 1]?.cursor;
	connection.pageInfo.endCursor = endCursor !== undefined ? endCursor : null;
	connection.pageInfo.startCursor =
		startCursor !== undefined ? startCursor : null;

	return connection;
};
