import "dotenv/config";
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  OrganizationTagUser,
  type InterfaceOrganizationTagUser,
} from "../../../src/models";
import {
  childTags as childTagsResolver,
  parseCursor,
} from "../../../src/resolvers/UserTag/childTags";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";

let MONGOOSE_INSTANCE: typeof mongoose;
let testChildTag1: TestUserTagType,
  testChildTag2: TestUserTagType,
  testParentTag: TestUserTagType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , [testParentTag, testChildTag1, testChildTag2]] =
    await createTwoLevelTagsWithOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("childTags resolver", () => {
  const parent = testParentTag as InterfaceOrganizationTagUser;
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      await childTagsResolver?.(parent, {}, {});
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
    const parent = testParentTag as InterfaceOrganizationTagUser;
    const connection = await childTagsResolver?.(
      parent,
      {
        first: 2,
      },
      {},
    );

    const totalCount = await OrganizationTagUser.find({
      parentTagId: testParentTag?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: testChildTag2?._id.toString(),
          node: {
            ...testChildTag2,
            _id: testChildTag2?._id.toString(),
          },
        },
        {
          cursor: testChildTag1?._id.toString(),
          node: {
            ...testChildTag1,
            _id: testChildTag1?._id.toString(),
          },
        },
      ],
      pageInfo: {
        endCursor: testChildTag1?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testChildTag2?._id.toString(),
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
      parentTagId: testParentTag?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(false);
    if (result.isSuccessful === false) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("returns success state if argument cursorValue is a valid cursor", async () => {
    const result = await parseCursor({
      cursorName: "after",
      cursorPath: ["after"],
      cursorValue: testChildTag1?._id.toString() as string,
      parentTagId: testParentTag?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testChildTag1?._id.toString());
    }
  });
});
