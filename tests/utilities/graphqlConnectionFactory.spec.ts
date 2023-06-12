import { beforeAll, describe, expect, it } from "vitest";
import {
  graphqlConnectionFactory,
  getLimit,
  getFilterObject,
  getSortingObject,
  generateConnectionObject,
} from "../../src/utilities/graphqlConnectionFactory";
import { type CursorPaginationInput } from "../../src/types/generatedGraphQLTypes";
import { Types } from "mongoose";
import { nanoid } from "nanoid";

describe("utilities -> graphqlConnectionFactory -> graphqlConnectionFactory", () => {
  it(`Returns a connection object with default/pre-defined fields which
represents a connection that has no data at all and cannot be paginated.`, () => {
    const connection = graphqlConnectionFactory<unknown>();

    expect(connection).toEqual({
      edges: [],
      pageInfo: {
        startCursor: null,
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });
});

describe("utilities -> graphqlConnectionFactory -> getLimit", () => {
  it(`Should return 1 + limit if the cursor is not supplied`, () => {
    const args: CursorPaginationInput = {
      limit: 10,
      direction: "FORWARD",
    };

    expect(getLimit(args)).toBe(11);
  });

  it(`Should return 2 + limit if the cursor is supplied`, () => {
    const args: CursorPaginationInput = {
      cursor: "123456",
      limit: 10,
      direction: "FORWARD",
    };

    expect(getLimit(args)).toBe(12);
  });
});

describe("utilities -> graphqlConnectionFactory -> getSortingObject", () => {
  it(`Should return the supplied sorting object when the direction is forward`, () => {
    const sortingObject = {
      a: 1,
      b: 1,
    };

    const payload = getSortingObject("FORWARD", sortingObject);

    expect(payload).toEqual({
      a: 1,
      b: 1,
    });
  });

  it(`Should return the supplied sorting object negated and in the same order when the direction is backward`, () => {
    const sortingObject = {
      a: 1,
      b: 1,
    };

    const payload = getSortingObject("BACKWARD", sortingObject);

    expect(payload).toEqual({
      a: -1,
      b: -1,
    });
  });
});

describe("utilities -> graphqlConnectionFactory -> getFilterObject", () => {
  it(`Should return null if no cursor is supplied`, () => {
    const args: CursorPaginationInput = {
      limit: 10,
      direction: "FORWARD",
    };

    const payload = getFilterObject(args);

    expect(payload).toEqual(null);
  });

  it(`Should return gte filter object if cursor is supplied and direction is forward`, () => {
    const args: CursorPaginationInput = {
      cursor: "12345",
      limit: 10,
      direction: "FORWARD",
    };

    const payload = getFilterObject(args);

    expect(payload).toEqual({
      _id: { $gte: "12345" },
    });
  });

  it(`Should return lte filter object if cursor is supplied and direction is backward`, () => {
    const args: CursorPaginationInput = {
      cursor: "12345",
      limit: 10,
      direction: "BACKWARD",
    };

    const payload = getFilterObject(args);

    expect(payload).toEqual({
      _id: { $lte: "12345" },
    });
  });
});

describe("utilities -> graphqlConnectionFactory -> getSortingObject", () => {
  it(`Should return the supplied sorting object when the direction is forward`, () => {
    const sortingObject = {
      a: 1,
      b: 1,
    };

    const payload = getSortingObject("FORWARD", sortingObject);

    expect(payload).toEqual({
      a: 1,
      b: 1,
    });
  });

  it(`Should return the supplied sorting object negated and in the same order when the direction is backward`, () => {
    const sortingObject = {
      a: 1,
      b: 1,
    };

    const payload = getSortingObject("BACKWARD", sortingObject);

    expect(payload).toEqual({
      a: -1,
      b: -1,
    });
  });
});

// To test generateConnectionObject function, we will create an abstract type to mock the results of our database query
type MongoModelBase = {
  _id: Types.ObjectId;
  a: string;
};

describe("utilities -> graphqlConnectionFactory -> generateConnectionObject -> General checks", () => {
  let fetchedObjects: MongoModelBase[];

  beforeAll(() => {
    fetchedObjects = Array.from({ length: 5 }, () => ({
      _id: Types.ObjectId(),
      a: nanoid(),
    }));
  });

  it(`returns blank connection result if there are no fetched objects`, () => {
    const args: CursorPaginationInput = {
      direction: "FORWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(args, [], (x) => x);

    expect(payload.errors.length).toBe(0);
    expect(payload.data).toMatchObject({
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
      },
    });
  });

  it(`returns error if the provided cursor is invalid`, () => {
    const args: CursorPaginationInput = {
      cursor: Types.ObjectId().toString(),
      direction: "FORWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(args, fetchedObjects, (x) => x);

    expect(payload.errors.length).toBe(1);
    expect(payload.errors[0]).toMatchObject({
      __typename: "IncorrectCursor",
      path: ["input", "direction"],
    });

    expect(payload.data).toBeNull();
  });
});

describe("utilities -> graphqlConnectionFactory -> generateConnectionObject -> Forward Pagination", () => {
  let fetchedObjects: MongoModelBase[];
  let fetchedObjectIds: string[];
  let allEdges: {
    cursor: string;
    node: { _id: Types.ObjectId };
  }[];

  beforeAll(() => {
    fetchedObjects = Array.from({ length: 5 }, () => ({
      _id: Types.ObjectId(),
      a: nanoid(),
    }));

    fetchedObjectIds = fetchedObjects.map((obj) => obj._id.toString());

    allEdges = fetchedObjects.map((obj) => ({
      cursor: obj._id.toString(),
      node: {
        _id: obj._id,
      },
    }));
  });

  it(`testing FORWARD pagination WITHOUT cursor and such that there IS NO next page`, () => {
    const args: CursorPaginationInput = {
      direction: "FORWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(
      args,
      fetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[0],
      endCursor: fetchedObjectIds[4],
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(payload.data!.edges.length).toBe(5);
    expect(payload.data!.edges).toEqual(allEdges);
  });

  it(`testing FORWARD pagination WITHOUT cursor and such that there IS A next page`, () => {
    const args: CursorPaginationInput = {
      direction: "FORWARD",
      limit: 3,
    };

    const payload = generateConnectionObject(
      args,
      fetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[0],
      endCursor: fetchedObjectIds[2],
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(payload.data!.edges.length).toBe(3);
    expect(payload.data!.edges).toEqual(allEdges.slice(0, 3));
  });

  it(`testing FORWARD pagination WITH cursor and such that there IS NO next page`, () => {
    const args: CursorPaginationInput = {
      cursor: fetchedObjectIds[0],
      direction: "FORWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(
      args,
      fetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[1],
      endCursor: fetchedObjectIds[4],
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(payload.data!.edges.length).toBe(4);
    expect(payload.data!.edges).toEqual(allEdges.slice(1));
  });

  it(`testing FORWARD pagination WITH cursor and such that there IS A next page`, () => {
    const args: CursorPaginationInput = {
      cursor: fetchedObjectIds[0],
      direction: "FORWARD",
      limit: 3,
    };

    const payload = generateConnectionObject(
      args,
      fetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[1],
      endCursor: fetchedObjectIds[3],
      hasNextPage: true,
      hasPreviousPage: true,
    });
    expect(payload.data!.edges.length).toBe(3);
    expect(payload.data!.edges).toEqual(allEdges.slice(1, 4));
  });
});

describe("utilities -> graphqlConnectionFactory -> generateConnectionObject -> Backward pagination", () => {
  let fetchedObjects: MongoModelBase[];
  let reversedFetchedObjects: MongoModelBase[];
  let fetchedObjectIds: string[];
  let allEdges: {
    cursor: string;
    node: { _id: Types.ObjectId };
  }[];

  beforeAll(() => {
    fetchedObjects = Array.from({ length: 5 }, () => ({
      _id: Types.ObjectId(),
      a: nanoid(),
    }));
    reversedFetchedObjects = Array.from(fetchedObjects).reverse();

    fetchedObjectIds = fetchedObjects.map((obj) => obj._id.toString());

    allEdges = fetchedObjects.map((obj) => ({
      cursor: obj._id.toString(),
      node: {
        _id: obj._id,
      },
    }));
  });

  it(`testing BACKWARD pagination WITHOUT cursor and such that there IS NO previous page`, () => {
    const args: CursorPaginationInput = {
      direction: "BACKWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(
      args,
      reversedFetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[0],
      endCursor: fetchedObjectIds[4],
      hasNextPage: false,
      hasPreviousPage: false,
    });
    expect(payload.data!.edges.length).toBe(5);
    expect(payload.data!.edges).toEqual(allEdges);
  });

  it(`testing BACKWARD pagination WITHOUT cursor and such that there IS A previous page`, () => {
    const args: CursorPaginationInput = {
      direction: "BACKWARD",
      limit: 3,
    };

    const payload = generateConnectionObject(
      args,
      reversedFetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[2],
      endCursor: fetchedObjectIds[4],
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(payload.data!.edges.length).toBe(3);
    expect(payload.data!.edges).toEqual(allEdges.slice(2, 5));
  });

  it(`testing BACKWARD pagination WITH cursor and such that there IS NO previous page`, () => {
    const args: CursorPaginationInput = {
      cursor: fetchedObjectIds[4],
      direction: "BACKWARD",
      limit: 10,
    };

    const payload = generateConnectionObject(
      args,
      reversedFetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[0],
      endCursor: fetchedObjectIds[3],
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(payload.data!.edges.length).toBe(4);
    expect(payload.data!.edges).toEqual(allEdges.slice(0, 4));
  });

  it(`testing BACKWARD pagination WITH cursor and such that there IS A previous page`, () => {
    const args: CursorPaginationInput = {
      cursor: fetchedObjectIds[4],
      direction: "BACKWARD",
      limit: 3,
    };

    const payload = generateConnectionObject(
      args,
      reversedFetchedObjects.slice(0, getLimit(args)),
      (x) => ({
        _id: x._id,
      })
    );

    expect(payload.errors.length).toBe(0);
    expect(payload.data).not.toBeNull();

    expect(payload.data!.pageInfo).toMatchObject({
      startCursor: fetchedObjectIds[1],
      endCursor: fetchedObjectIds[3],
      hasNextPage: true,
      hasPreviousPage: true,
    });
    expect(payload.data!.edges.length).toBe(3);
    expect(payload.data!.edges).toEqual(allEdges.slice(1, 4));
  });
});
