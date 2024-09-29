import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAssignUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  TAG_NOT_FOUND,
  USER_ALREADY_HAS_TAG,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, TagUser } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import {
  createRootTagWithOrg,
  createTwoLevelTagsWithOrg,
} from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let adminUser: TestUserType;
let adminUser2: TestUserType;
let testTag2: TestUserTagType;
let testTag: TestUserTagType;
let testSubTag1: TestUserTagType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, , [testTag, testSubTag1]] = await createTwoLevelTagsWithOrg();
  [adminUser2, , testTag2] = await createRootTagWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> assignUserTag", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.input.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: new Types.ObjectId().toString(),
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: adminUser?._id };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no tag exists with _id === args.input.tagId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${TAG_NOT_FOUND.MESSAGE}`,
      );
    }
  });

  it(`throws Not Authorized Error if the current user is not a superadmin or admin of the organization of the tag being assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws Error if the request user is not a member of organization of the tag being assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: randomUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`,
      );
    }
  });

  it(`Tag assign should be successful and the user who has been assigned the tag is returned`, async () => {
    const args: MutationAssignUserTagArgs = {
      input: {
        userId: adminUser2?._id,
        tagId: testTag2?._id.toString() ?? "",
      },
    };
    const context = {
      userId: adminUser2?._id,
    };

    const { assignUserTag: assignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/assignUserTag"
    );

    const payload = await assignUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(adminUser2?._id.toString());

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    expect(tagAssigned).toBeTruthy();
  });

  it(`Should assign all the ancestor tags and returns the user that is assigned`, async () => {
    const args: MutationAssignUserTagArgs = {
      input: {
        userId: adminUser?._id,
        tagId: testSubTag1?._id.toString() ?? "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    const { assignUserTag: assignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/assignUserTag"
    );

    const payload = await assignUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(adminUser?._id.toString());

    const subTagAssigned = await TagUser.exists({
      ...args.input,
    });

    const ancestorTagAssigned = await TagUser.exists({
      ...args.input,
      tagId: testTag?._id.toString() ?? "",
    });

    expect(subTagAssigned).toBeTruthy();
    expect(ancestorTagAssigned).toBeTruthy();
  });

  it(`Throws USER_ALREADY_HAS_TAG error if tag with _id === args.input.tagId is already assigned to user with _id === args.input.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };
      const context = {
        userId: adminUser?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_HAS_TAG.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(`${USER_ALREADY_HAS_TAG.MESSAGE}`);
    }
  });
  it("throws error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: randomUser?._id,
          tagId: testTag?._id.toString() ?? "",
        },
      };
      const temp = await createTestUser();
      await AppUserProfile.deleteOne({
        userId: temp?._id,
      });
      const context = {
        userId: temp?._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
