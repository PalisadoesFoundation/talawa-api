import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const interfaces = gql`
  """
  The standard graphQL connection page info that contains metadata about a
  particular instance of a connection. ALl other custom connection page info
  types must implement this interface.
  """
  interface ConnectionPageInfo {
    """
    A field to tell the value of cursor for the last edge of a particular instance of a
    connection.
    """
    endCursor: String
    """
    A field to tell whether the connection has additional edges after the
    edge with endCursor as its cursor.
    """
    hasNextPage: Boolean!
    """
    A field to tell whether the connection has additional edges
    before the edge with startCursor as its cursor.
    """
    hasPreviousPage: Boolean!
    """
    A field to tell the value of cursor for the first edge of a particular instance of a
    connection.
    """
    startCursor: String
  }
`;
