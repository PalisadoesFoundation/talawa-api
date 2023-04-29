import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationRemoveUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { OrganizationTagUser, TagUser } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";

let testUser: TestUserType;
let randomUser: TestUserType;

let rootTag: TestUserTagType,
  childTag1: TestUserTagType,
  childTag2: TestUserTagType;

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  [testUser, , [rootTag, childTag1, childTag2]] =
    await createTwoLevelTagsWithOrg();
  randomUser = await createTestUser();

  // Assign the created tags to the testUser
  await TagUser.insertMany([
    {
      userId: testUser?._id,
      tagId: rootTag?._id,
    },
    {
      userId: testUser?._id,
      tagId: childTag1?._id,
    },
    {
      userId: testUser?._id,
      tagId: childTag2?._id,
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeUserTag", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveUserTagArgs = {
        id: rootTag ? rootTag._id.toString() : "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeUserTag: removeUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserTag"
      );

      await removeUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws TAG_NOT_FOUND error if the no tag exists with the _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveUserTagArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeUserTag: removeUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserTag"
      );

      await removeUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
    }
  });

  it(`throws USER_NOT_AUTHORIZED error if the current user is not authorized to remove the tag`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveUserTagArgs = {
        id: rootTag ? rootTag._id.toString() : "",
      };

      const context = {
        userId: randomUser?.id,
      };

      const { removeUserTag: removeUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserTag"
      );

      await removeUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`deletes the tag (along with all its child tags) from the OrganizationTagUser model and its corresponding entries from TagUser model`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationRemoveUserTagArgs = {
      id: rootTag ? rootTag._id.toString() : "",
    };

    const context = {
      userId: testUser?.id,
    };

    const { removeUserTag: removeUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/removeUserTag"
    );

    await removeUserTagResolver?.({}, args, context);

    // Check that the tag and its children must be deleted from the OrganizationTagUser model
    const tagExists = await OrganizationTagUser.exists({
      $or: [
        { _id: rootTag?._id },
        { _id: childTag1?._id },
        { _id: childTag2?._id },
      ],
    });

    expect(tagExists).toBeFalsy();

    // Check that all the entries related to the tag and its children must be deleted in the TagUser model
    const userTagExists = await TagUser.exists({
      $or: [
        { tagId: rootTag?._id },
        { tagId: childTag1?._id },
        { tagId: childTag2?._id },
      ],
    });

    expect(userTagExists).toBeFalsy();
  });
});
