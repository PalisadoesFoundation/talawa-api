import "dotenv/config";
import {
  parseCursor,
  usersAssignedTo as usersAssignedToResolver,
} from "../../../src/resolvers/UserTag/usersAssignedTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTagsAndAssignToUser } from "../../helpers/tags";
import { GraphQLError } from "graphql";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import {
  User,
  type InterfaceOrganizationTagUser,
  TagUser,
} from "../../../src/models";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testTag: TestUserTagType, testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , [testTag]] = await createTagsAndAssignToUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("usersAssignedTo resolver", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    const parent = testTag as InterfaceOrganizationTagUser;
    try {
      await usersAssignedToResolver?.(parent, {}, {});
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
    const connection = await usersAssignedToResolver?.(
      parent,
      {
        first: 3,
      },
      {},
    );

    const tagUser = await TagUser.findOne({
      tagId: testTag?._id,
      userId: testUser?._id,
    });

    const user = await User.findOne({
      _id: testUser?._id,
    });

    const totalCount = await TagUser.find({
      tagId: testTag?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: tagUser?._id.toString(),
          node: user?.toObject(),
        },
      ],
      pageInfo: {
        endCursor: tagUser?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: tagUser?._id.toString(),
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
      tagId: testTag?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const tagUser = await TagUser.findOne({
      tagId: testTag?._id,
      userId: testUser?._id,
    });

    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: tagUser?._id.toString() as string,
      tagId: testTag?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(tagUser?._id.toString());
    }
  });
});
