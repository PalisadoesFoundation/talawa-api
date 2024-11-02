import "dotenv/config";
import {
  parseCursor,
  tagsAssignedWith as tagsAssignedWithResolver,
} from "../../../src/resolvers/User/tagsAssignedWith";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserTagType } from "../../helpers/tags";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTagsAndAssignToUser } from "../../helpers/tags";
import { GraphQLError } from "graphql";
import type { DefaultGraphQLArgumentError } from "../../../src/utilities/graphQLConnection";
import {
  type InterfaceUser,
  TagUser,
  OrganizationTagUser,
} from "../../../src/models";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testTag: TestUserTagType,
  testUser: TestUserType,
  testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization, [testTag]] = await createTagsAndAssignToUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("tagsAssignedWith resolver", () => {
  it(`throws GraphQLError if invalid arguments are provided to the resolver`, async () => {
    const parent = testUser as InterfaceUser;
    try {
      await tagsAssignedWithResolver?.(parent, {}, {});
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
    const parent = testUser as InterfaceUser;
    const connection = await tagsAssignedWithResolver?.(
      parent,
      {
        first: 3,
        organizationId: testOrganization?._id,
      },
      {},
    );

    const tagUser = await TagUser.findOne({
      tagId: testTag?._id,
      userId: testUser?._id,
    });

    const tag = await OrganizationTagUser.findOne({
      _id: testTag?._id,
    });

    const totalCount = await TagUser.find({
      userId: testUser?._id,
    }).countDocuments();

    expect(connection).toEqual({
      edges: [
        {
          cursor: tagUser?._id.toString(),
          node: tag?.toObject(),
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
      userId: testUser?._id.toString() as string,
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
      userId: testUser?._id.toString() as string,
    });

    expect(result.isSuccessful).toEqual(true);
    if (result.isSuccessful === true) {
      expect(result.parsedCursor).toEqual(tagUser?._id.toString());
    }
  });
});
