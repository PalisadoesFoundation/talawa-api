import { ConnectionPageInfo } from "../types/generatedGraphQLTypes";

interface InterfaceConnectionEdge<T> {
  cursor: string;
  node: T;
}

interface InterfaceConnection<T> {
  edges?: Array<InterfaceConnectionEdge<T> | null>;
  pageInfo: ConnectionPageInfo;
}

/*
This is a factory function to quickly create a graphql
connection object. The function accepts a generic type
'T' which is used to reference the type of node that this
connection and it's edges will reference. A node is
a business object which can be uniquely identified in graphql.
For example `User`, `Organization`, `Event`, `Post` etc.
All of these objects are viable candiates for a node and
can be paginated using graphql connections. The default object
returned by this function represents a connection which has no
data at all, i.e., the table/collection for that node(along with
other constraints like filters if any) is completely empty in database.
This object will need to be transformed according to different
logic inside resolvers.
*/
export function graphqlConnectionFactory<T>(): InterfaceConnection<T> {
  return {
    edges: [],
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
  };
}
