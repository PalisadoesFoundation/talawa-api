import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUnassignUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
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
  USER_DOES_NOT_HAVE_THE_TAG,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, TagUser } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import { createTwoLevelTagsWithOrg } from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let adminUser: TestUserType;
let testTag: TestUserTagType;
let testSubTag1: TestUserTagType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, , [testTag, testSubTag1]] = await createTwoLevelTagsWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> unassignUserTag", () => {
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag ? testTag._id.toString() : "",
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: new Types.ObjectId().toString(),
          tagId: testTag ? testTag._id.toString() : "",
        },
      };

      const context = { userId: adminUser?._id };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag ? testTag._id.toString() : "",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws USER_DOES_NOT_HAVE_THE_TAG error if the request tries to unassign the tag from a user who has not been tagged with the tag with _id === args.input.tagId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag ? testTag._id.toString() : "",
        },
      };
      const context = {
        userId: adminUser?._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_DOES_NOT_HAVE_THE_TAG.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_HAVE_THE_TAG.MESSAGE}`,
      );
    }
  });

  it(`tag unassign should be successful and the user who has been unassigned the tag is returned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    const args: MutationUnassignUserTagArgs = {
      input: {
        userId: adminUser?._id,
        tagId: testTag ? testTag._id.toString() : "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    // Assign the tag to the user
    await TagUser.create({
      ...args.input,
      organizationId: testTag?.organizationId,
    });

    // Test the unassignUserTag resolver
    const { unassignUserTag: unassignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/unassignUserTag"
    );

    const payload = await unassignUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(adminUser?._id.toString());

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    expect(tagAssigned).toBeFalsy();
  });

  it(`should unassign all the child tags and decendent tags of a parent tag and return the user`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    const args: MutationUnassignUserTagArgs = {
      input: {
        userId: adminUser?._id,
        tagId: testTag ? testTag._id.toString() : "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    // Assign the parent and sub tag to the user
    await TagUser.create({
      ...args.input,
      organizationId: testTag?.organizationId,
    });

    await TagUser.create({
      ...args.input,
      tagId: testSubTag1 ? testSubTag1._id.toString() : "",
      organizationId: testSubTag1?.organizationId,
    });

    // Test the unassignUserTag resolver
    const { unassignUserTag: unassignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/unassignUserTag"
    );

    const payload = await unassignUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(adminUser?._id.toString());

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    const subTagAssigned = await TagUser.exists({
      ...args.input,
      tagId: testSubTag1 ? testSubTag1._id.toString() : "",
    });

    expect(tagAssigned).toBeFalsy();
    expect(subTagAssigned).toBeFalsy();
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const newUser = await createTestUser();
      await AppUserProfile.deleteOne({
        userId: newUser?.id,
      });
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser?._id,
          tagId: testTag ? testTag._id.toString() : "",
        },
      };
      const context = {
        userId: newUser?._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
