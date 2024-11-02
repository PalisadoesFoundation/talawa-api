import "dotenv/config";
import {
  parseCursor,
  usersToAssignTo as usersToAssignToResolver,
} from "../../../src/resolvers/UserTag/usersToAssignTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createRootTagWithOrg } from "../../helpers/tags";
import { GraphQLError } from "graphql";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { User, type InterfaceOrganizationTagUser } from "../../../src/models";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testTag: TestUserTagType, testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testTag] = await createRootTagWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("usersToAssignTo resolver", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    const parent = testTag as InterfaceOrganizationTagUser;

    try {
      await usersToAssignToResolver?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it(`returns the expected connection object`, async () => {
    const parent = testTag as InterfaceOrganizationTagUser;

    const connection = await usersToAssignToResolver?.(
      parent,
      {
        first: 3,
      },
      {},
    );

    const user = await User.findOne({
      _id: testUser?._id,
    }).lean();

    const totalCount = 1; // only one user belonging to the organization

    expect(connection).toEqual({
      edges: [
        {
          cursor: testUser?._id.toString(),
          node: {
            ...user,
            _id: user?._id.toString(),
            tagUsers: [],
          },
        },
      ],
      pageInfo: {
        endCursor: testUser?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testUser?._id.toString(),
      },
      totalCount,
    });
  });
});

describe("parseCursor function", () => {
  it("returns failure state if argument cursorValue is an invalid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: new Types.ObjectId().toString(),
    });

    expect(result.isSuccessful).toEqual(false);

    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const parserCursorValue = await User.findOne({
      _id: testUser?._id,
    });

    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: parserCursorValue?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);

    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(parserCursorValue?._id.toString());
    }
  });
});
