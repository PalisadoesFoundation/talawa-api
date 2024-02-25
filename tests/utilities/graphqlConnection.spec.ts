import { describe, expect, it } from "vitest";
import {
  isNotNullish,
  generateDefaultGraphQLConnection,
  transformToDefaultGraphQLConnection,
  parseGraphQLConnectionArguments,
  parseGraphQLConnectionArgumentsWithWhere,
  parseGraphQLConnectionArgumentsWithSortedBy,
  parseGraphQLConnectionArgumentsWithSortedByAndWhere,
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
} from "../../src/utilities/graphQLConnection";

describe("isNotNullish function", () => {
  it("returns false when argument value is undefined", () => {
    const result = isNotNullish(undefined);
    expect(result).toEqual(false);
  });
  it("returns false when argument value is null", () => {
    const result = isNotNullish(null);
    expect(result).toEqual(false);
  });
  it("returns true when argument value is neither undefined nor null", () => {
    const result = isNotNullish("this string ain't nullish");
    expect(result).toEqual(true);
  });
});

describe("generateDefaultGraphQLConnection function", () => {
  it(`returns a graphQL connection object which corresponds to a connection with no data
   and no possible edge traversal in any direction.`, () => {
    const connection = generateDefaultGraphQLConnection();

    expect(connection).toEqual({
      edges: [],
      pageInfo: {
        startCursor: null,
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      totalCount: 0,
    });
  });
});

describe("parseGraphQLConnectionArguments function", () => {
  it("returns the failure state if argument last is provided with argument first", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        first: 1,
        last: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument before is provided with argument first", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        before: "",
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument first exceeds argument maximumLimit", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument after is an invalid cursor", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        after: "some invalid cursor",
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [
          {
            message: "Argument after is an invalid cursor.",
            path: ["after"],
          },
        ],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument after is provided with argument last", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        after: "",
        last: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument last exceeds argument maximumLimit", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        last: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument before is an invalid cursor", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        before: "some invalid cursor",
        last: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [
          {
            message: "Argument before is an invalid cursor.",
            path: ["before"],
          },
        ],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state when neither argument first nor argument last are passed", async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {},
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the success state if argument args contains valid connection arguments
  after and first`, async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        after: "parsedCursor",
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
    });

    expect(result.isSuccessful).toEqual(true);
  });

  it(`returns the success state if argument args contains valid connection arguments
  before and last`, async () => {
    const result = await parseGraphQLConnectionArguments({
      args: {
        before: "parsedCursor",
        last: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("parseGraphQLConnectionArgumentsWithWhere function", () => {
  it(`returns the failure state if argument args contains invalid connection arguments
     and argument parseWhereResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument args contains invalid connection arguments`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        errors: [],
        isSuccessful: false,
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument parseWhereResult contains the failure state", async () => {
    const result = await parseGraphQLConnectionArgumentsWithWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the success state if argument args contains valid connection arguments and
   argument parseWhereResult contains the success state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("parseGraphQLConnectionArgumentsWithSort function", () => {
  it(`returns the failure state if argument args contains invalid connection arguments and
   argument parseSortResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedBy({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument args contains invalid connection arguments`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedBy({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument parseSortResult contains the failure state", async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedBy({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the success state if argument args contains valid connection arguments and
   argument parseSort returns the success state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedBy({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("parseGraphQLConnectionArgumentsWithSortedByAndWhere function", () => {
  it(`returns the failure state if argument args contains invalid connection arguments
   and argument parseWhereResult contains the failure state and argument parseSortResult
   contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument args contains invalid connection arguments
  and argument parseWhereResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument args contains invalid connection arguments
  and argument parseSortResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument args contains invalid connection arguments`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 3,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument parseWhereResult contains the failure state
  and argument parseSortResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the failure state if argument parseWhereResult contains the failure state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        errors: [],
        isSuccessful: false,
      },
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it("returns the failure state if argument parseSortResult contains the failure state", async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
      parseSortedByResult: {
        errors: [],
        isSuccessful: false,
      },
    });

    expect(result.isSuccessful).toEqual(false);
  });

  it(`returns the success state if argument args contains valid connection arguments
  and argument parseWhereResult contains the success state and argument parseSortResult
  contains the success state`, async () => {
    const result = await parseGraphQLConnectionArgumentsWithSortedByAndWhere({
      args: {
        first: 1,
      },
      maximumLimit: 2,
      parseCursor: async () => ({
        isSuccessful: true,
        parsedCursor: "parsedCursor",
      }),
      parseWhereResult: {
        isSuccessful: true,
        parsedWhere: {},
      },
      parseSortedByResult: {
        isSuccessful: true,
        parsedSortedBy: {},
      },
    });

    expect(result.isSuccessful).toEqual(true);
  });
});

describe("getCommonGraphQLConnectionFilter function", () => {
  it(`when argument cursor is non-null and argument direction corresponds to backward`, async () => {
    const cursor = "cursor";

    expect(
      getCommonGraphQLConnectionFilter({
        cursor,
        direction: "BACKWARD",
      }),
    ).toEqual({
      _id: {
        $gt: cursor,
      },
    });
  });

  it(`when argument cursor is non-null and argument direction corresponds to forward`, async () => {
    const cursor = "cursor";

    expect(
      getCommonGraphQLConnectionFilter({
        cursor,
        direction: "FORWARD",
      }),
    ).toEqual({
      _id: {
        $lt: cursor,
      },
    });
  });

  it(`when argument cursor is null`, async () => {
    expect(
      getCommonGraphQLConnectionFilter({
        cursor: null,
        direction: "BACKWARD",
      }),
    ).toEqual({});
  });
});

describe("getCommonGraphQLConnectionSort function", () => {
  it(`when argument direction corresponds to backward`, async () => {
    expect(
      getCommonGraphQLConnectionSort({
        direction: "BACKWARD",
      }),
    ).toEqual({
      _id: 1,
    });
  });

  it(`when argument direction corresponds to forward`, async () => {
    expect(
      getCommonGraphQLConnectionSort({
        direction: "FORWARD",
      }),
    ).toEqual({
      _id: -1,
    });
  });
});

describe("transformToDefaultGraphQLConnection function", () => {
  it(`when totalCount is 0, returns default graphql connection object with default fields
  that correspond to a connection with no data and no traversal possible in any direction.`, () => {
    const connection = transformToDefaultGraphQLConnection({
      objectList: [],
      parsedArgs: {
        cursor: "cursor",
        direction: "BACKWARD",
        limit: 1,
      },
      totalCount: 0,
    });

    expect(connection).toEqual(generateDefaultGraphQLConnection());
  });

  describe("when connection is traversing backward", () => {
    it(`when argument cursor is non-null and length objectList is 0`, () => {
      const connection = transformToDefaultGraphQLConnection({
        objectList: [],
        parsedArgs: {
          cursor: "cursor",
          direction: "BACKWARD",
          limit: 1,
        },
        totalCount: 1,
      });

      expect(connection).toEqual({
        edges: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: null,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is non-null and length of objectList is equal to argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
        {
          _id: "3",
        },
      ];
      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: "cursor",
          direction: "BACKWARD",
          limit: objectList.length,
        },
        totalCount: 1,
      });

      objectList.pop();
      const reversedObjectListEdges = objectList.reverse().map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: reversedObjectListEdges,
        pageInfo: {
          endCursor:
            reversedObjectListEdges[reversedObjectListEdges.length - 1].cursor,
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: reversedObjectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is null and length of objectList is equal to argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
        {
          _id: "3",
        },
      ];
      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: null,
          direction: "BACKWARD",
          limit: objectList.length,
        },
        totalCount: 1,
      });

      objectList.pop();
      const reversedObjectListEdges = objectList.reverse().map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: reversedObjectListEdges,
        pageInfo: {
          endCursor:
            reversedObjectListEdges[reversedObjectListEdges.length - 1].cursor,
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: reversedObjectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });
  });

  it(`when argument cursor is non-null and length of objectList is less than argument limit`, () => {
    const objectList = [
      {
        _id: "1",
      },
      {
        _id: "2",
      },
    ];
    const connection = transformToDefaultGraphQLConnection({
      objectList: [...objectList],
      parsedArgs: {
        cursor: "cursor",
        direction: "BACKWARD",
        limit: objectList.length + 1,
      },
      totalCount: 1,
    });

    const reversedObjectListEdges = objectList.reverse().map((object) => ({
      cursor: object._id,
      node: {
        _id: object._id,
      },
    }));

    expect(connection).toEqual({
      edges: reversedObjectListEdges,
      pageInfo: {
        endCursor:
          reversedObjectListEdges[reversedObjectListEdges.length - 1].cursor,
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: reversedObjectListEdges[0].cursor,
      },
      totalCount: 1,
    });
  });

  it(`when argument cursor is null and length of objectList is less than argument limit`, () => {
    const objectList = [
      {
        _id: "1",
      },
      {
        _id: "2",
      },
    ];
    const connection = transformToDefaultGraphQLConnection({
      objectList: [...objectList],
      parsedArgs: {
        cursor: null,
        direction: "BACKWARD",
        limit: objectList.length + 1,
      },
      totalCount: 1,
    });

    const reversedObjectListEdges = objectList.reverse().map((object) => ({
      cursor: object._id,
      node: {
        _id: object._id,
      },
    }));
    expect(connection).toEqual({
      edges: reversedObjectListEdges,
      pageInfo: {
        endCursor:
          reversedObjectListEdges[reversedObjectListEdges.length - 1].cursor,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: reversedObjectListEdges[0].cursor,
      },
      totalCount: 1,
    });
  });

  describe("when connection is traversing forward", () => {
    it(`when argument cursor is non-null and length of objectList is 0`, () => {
      const connection = transformToDefaultGraphQLConnection({
        objectList: [],
        parsedArgs: {
          cursor: "cursor",
          direction: "FORWARD",
          limit: 1,
        },
        totalCount: 1,
      });

      expect(connection).toEqual({
        edges: [],
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: null,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is non-null and length of objectList is equal to argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
        {
          _id: "3",
        },
      ];

      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: "cursor",
          direction: "FORWARD",
          limit: objectList.length,
        },
        totalCount: 1,
      });

      objectList.pop();
      const objectListEdges = objectList.map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: objectListEdges,
        pageInfo: {
          endCursor: objectListEdges[objectListEdges.length - 1].cursor,
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: objectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is null and length of objectList is equal to argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
        {
          _id: "3",
        },
      ];

      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: null,
          direction: "FORWARD",
          limit: objectList.length,
        },
        totalCount: 1,
      });

      objectList.pop();
      const objectListEdges = objectList.map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: objectListEdges,
        pageInfo: {
          endCursor: objectListEdges[objectListEdges.length - 1].cursor,
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: objectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is non-null and length of objectList is less than argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
      ];

      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: "cursor",
          direction: "FORWARD",
          limit: objectList.length + 1,
        },
        totalCount: 1,
      });

      const objectListEdges = objectList.map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: objectListEdges,
        pageInfo: {
          endCursor: objectListEdges[objectListEdges.length - 1].cursor,
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: objectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });

    it(`when argument cursor is null and length of objectList is less than argument limit`, () => {
      const objectList = [
        {
          _id: "1",
        },
        {
          _id: "2",
        },
      ];

      const connection = transformToDefaultGraphQLConnection({
        objectList: [...objectList],
        parsedArgs: {
          cursor: null,
          direction: "FORWARD",
          limit: objectList.length + 1,
        },
        totalCount: 1,
      });

      const objectListEdges = objectList.map((object) => ({
        cursor: object._id,
        node: {
          _id: object._id,
        },
      }));

      expect(connection).toEqual({
        edges: objectListEdges,
        pageInfo: {
          endCursor: objectListEdges[objectListEdges.length - 1].cursor,
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: objectListEdges[0].cursor,
        },
        totalCount: 1,
      });
    });
  });
});
