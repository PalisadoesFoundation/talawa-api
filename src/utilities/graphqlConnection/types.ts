/**
 * Type of the object containing the parsed default arguments of a graphql connection.
 */
export type ParsedDefaultGraphQLConnectionArguments<Cursor = string> = {
	/**
	 * The cursor representing the position in the connection.
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
 * Type of the object containing the parsed default arguments of a graphql connection with where filtering.
 * Extends the base connection arguments with a generic where type.
 */
export type ParsedDefaultGraphQLConnectionArgumentsWithWhere<
	Cursor = string,
	Where = unknown,
> = ParsedDefaultGraphQLConnectionArguments<Cursor> & {
	/**
	 * The where filter criteria to apply to the connection.
	 */
	where: Where;
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
