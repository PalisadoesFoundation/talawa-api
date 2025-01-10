import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAddPeopleToUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
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
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, TagUser, User } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import {
  createRootTagWithOrg,
  createTwoLevelTagsWithOrg,
} from "../../helpers/tags";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let adminUser: TestUserType;
let adminUser2: TestUserType;
let testTag2: TestUserTagType;
let testTag: TestUserTagType;
let testSubTag1: TestUserTagType;
let testOrg2: TestOrganizationType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, , [testTag, testSubTag1]] = await createTwoLevelTagsWithOrg();
  [adminUser2, testOrg2, testTag2] = await createRootTagWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addPeopleToUserTag", () => {
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
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [adminUser?._id],
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
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
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [adminUser?._id],
          tagId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
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
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [adminUser?._id],
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if one of the requested users doesn't exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [adminUser?._id, new Types.ObjectId()],
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = { userId: adminUser?._id };

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Error if one of the requested users is not a member of organization of the tag being assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [adminUser?._id.toString(), randomUser?._id.toString()],
          tagId: testTag?._id.toString() ?? "",
        },
      };

      const context = {
        userId: adminUser?._id,
      };

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`,
      );
    }
  });

  it(`Tag assignment should be successful and the tag is returned`, async () => {
    const args: MutationAddPeopleToUserTagArgs = {
      input: {
        userIds: [adminUser2?._id.toString()],
        tagId: testTag2?._id.toString() ?? "",
      },
    };

    const context = {
      userId: adminUser2?._id,
    };

    const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/addPeopleToUserTag"
    );

    const payload = await addPeopleToUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(testTag2?._id.toString());

    const tagAssigned = await TagUser.exists({
      tagId: args.input.tagId,
      userId: adminUser2?._id,
    });

    expect(tagAssigned).toBeTruthy();
  });

  it(`Tag assignment should be successful and only new assignments are made and the tag is returned`, async () => {
    await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        joinedOrganizations: testOrg2?._id,
      },
    );

    const args: MutationAddPeopleToUserTagArgs = {
      input: {
        userIds: [adminUser2?._id.toString(), randomUser?._id.toString()],
        tagId: testTag2?._id.toString() ?? "",
      },
    };

    const context = {
      userId: adminUser2?._id,
    };

    const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/addPeopleToUserTag"
    );

    const payload = await addPeopleToUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(testTag2?._id.toString());

    const tagAssigned = await TagUser.exists({
      tagId: args.input.tagId,
      userId: adminUser2?._id,
    });

    expect(tagAssigned).toBeTruthy();
  });

  it(`Returns the tag if there aren't any new assignments to be made and the tag is returned`, async () => {
    await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        joinedOrganizations: testOrg2?._id,
      },
    );

    const args: MutationAddPeopleToUserTagArgs = {
      input: {
        userIds: [adminUser2?._id.toString(), randomUser?._id.toString()],
        tagId: testTag2?._id.toString() ?? "",
      },
    };

    const context = {
      userId: adminUser2?._id,
    };

    const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/addPeopleToUserTag"
    );

    const payload = await addPeopleToUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(testTag2?._id.toString());

    const tagAssigned = await TagUser.exists({
      tagId: args.input.tagId,
      userId: adminUser2?._id,
    });

    expect(tagAssigned).toBeTruthy();
  });

  it(`Should assign all the ancestor tags and returns the current tag`, async () => {
    const args: MutationAddPeopleToUserTagArgs = {
      input: {
        userIds: [adminUser?._id.toString()],
        tagId: testSubTag1?._id.toString() ?? "",
      },
    };
    const context = {
      userId: adminUser?._id,
    };

    const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/addPeopleToUserTag"
    );

    const payload = await addPeopleToUserTagResolver?.({}, args, context);

    expect(payload?._id.toString()).toEqual(testSubTag1?._id.toString());

    const subTagAssigned = await TagUser.exists({
      tagId: args.input.tagId,
      userId: adminUser?._id,
    });

    const ancestorTagAssigned = await TagUser.exists({
      tagId: testTag?._id.toString() ?? "",
      userId: adminUser?._id,
    });

    expect(subTagAssigned).toBeTruthy();
    expect(ancestorTagAssigned).toBeTruthy();
  });

  it("throws error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddPeopleToUserTagArgs = {
        input: {
          userIds: [randomUser?._id],
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

      const { addPeopleToUserTag: addPeopleToUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/addPeopleToUserTag"
      );

      await addPeopleToUserTagResolver?.({}, args, context);
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
