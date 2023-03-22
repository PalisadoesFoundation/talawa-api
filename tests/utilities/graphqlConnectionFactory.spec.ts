import { describe, expect, it } from "vitest";
import { graphqlConnectionFactory } from "../../src/utilities/graphqlConnectionFactory";

describe("utilities -> graphqlConnectionFactory", () => {
  it(`Returns a connection object with default/pre-defined fields which
represents a connection that has no data at all and cannot be paginated.`, async () => {
    const connection = graphqlConnectionFactory<unknown>();

    expect(connection).toEqual({
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
      },
    });
  });
});
