import "dotenv/config";
import { GraphQLError } from "graphql";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceOrganization } from "../../../src/models";
import { OrganizationTagUser } from "../../../src/models";
import {
  parseCursor,
  userTags as userTagsResolver,
} from "../../../src/resolvers/Organization/userTags";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserTagType } from "../../helpers/tags";
import {
  createRootTagsWithOrg,
  createTwoLevelTagsWithOrg,
} from "../../helpers/tags";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUserTag1: TestUserTagType, testUserTag2: TestUserTagType;
let testRootTag: TestUserTagType, testSubTag: TestUserTagType;
let testOrganization: TestOrganizationType;
let testOrganization2: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization, [testUserTag1, testUserTag2]] =
    await createRootTagsWithOrg(2);
  [, testOrganization2, [testRootTag, testSubTag]] =
    await createTwoLevelTagsWithOrg();

  testRootTag = await OrganizationTagUser.findOneAndUpdate(
    {
      _id: testRootTag?._id,
    },
    {
      name: "testRootTag",
    },
    { new: true },
  ).lean();

  testSubTag = await OrganizationTagUser.findOneAndUpdate(
    {
      _id: testSubTag?._id,
    },
    {
      name: "testSubTag",
    },
    { new: true },
  ).lean();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("userTags resolver", () => {
  const parent = testOrganization?.toObject() as InterfaceOrganization;
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    try {
      await userTagsResolver?.(parent, {}, {});
    } catch (error) {
      if (error instanceof GraphQLError) {
        expect(error.extensions.code).toEqual("INVALID_ARGUMENTS");
        expect(
          (error.extensions.errors as DefaultGraphQLArgumentError[]).length,
        ).toBeGreaterThan(0);
      }
    }
  });

  it(`returns the expected connection object, i.e. all the root tags`, async () => {
    const parent = testOrganization?.toObject() as InterfaceOrganization;

    const connection = await userTagsResolver?.(
      parent,
      {
        first: 2,
      },
      {},
    );

    const totalCount = await OrganizationTagUser.find({
      organizationId: testOrganization?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: testUserTag2?._id.toString(),
          node: {
            ...testUserTag2,
            _id: testUserTag2?._id.toString(),
          },
        },
        {
          cursor: testUserTag1?._id.toString(),
          node: {
            ...testUserTag1,
            _id: testUserTag1?._id.toString(),
          },
        },
      ],
      pageInfo: {
        endCursor: testUserTag1?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testUserTag2?._id.toString(),
      },
      totalCount,
    });
  });

  it(`returns all the tags (including nested tags), if the where input is defined`, async () => {
    const parent = testOrganization2?.toObject() as InterfaceOrganization;

    const connection = await userTagsResolver?.(
      parent,
      {
        first: 2,
        where: { name: { starts_with: "test" } },
        sortedBy: { id: "ASCENDING" },
      },
      {},
    );

    const totalCount = await OrganizationTagUser.find({
      name: new RegExp("^test", "i"),
      organizationId: testOrganization2?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: testRootTag?._id.toString(),
          node: {
            ...testRootTag,
            _id: testRootTag?._id.toString(),
          },
        },
        {
          cursor: testSubTag?._id.toString(),
          node: {
            ...testSubTag,
            _id: testSubTag?._id.toString(),
          },
        },
      ],
      pageInfo: {
        endCursor: testSubTag?._id.toString(),
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: testRootTag?._id.toString(),
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
      organizationId: testOrganization?._id.toString() as string,
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
      cursorValue: testUserTag1?._id.toString() as string,
      organizationId: testOrganization?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(testUserTag1?._id.toString());
    }
  });
});
