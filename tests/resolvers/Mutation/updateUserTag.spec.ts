import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
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
  NO_CHANGE_IN_TAG_NAME,
  TAG_ALREADY_EXISTS,
  TAG_NOT_FOUND,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, OrganizationTagUser } from "../../../src/models";
import type { TestUserTagType } from "../../helpers/tags";
import { createRootTagsWithOrg } from "../../helpers/tags";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;

let testUser: TestUserType;
let testTag: TestUserTagType, testTag2: TestUserTagType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , [testTag, testTag2]] = await createRootTagsWithOrg(2);
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateUserTag", () => {
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
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag?._id.toString() ?? "",
          name: "NewName",
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no tag exists with _id === args.input._id `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: Types.ObjectId().toString(),
          name: "NewName",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${TAG_NOT_FOUND.MESSAGE}`
      );
    }
  });

  it(`throws Not Authorized Error if the user is not a superadmin or admin of the organization of the tag beind updated`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag?._id.toString() ?? "",
          name: "NewName",
        },
      };

      const context = {
        userId: randomUser?._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws error if current name of the tag and the new name provided is the same`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag?._id.toString() ?? "",
          name: testTag?.name ?? "",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${NO_CHANGE_IN_TAG_NAME.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${NO_CHANGE_IN_TAG_NAME.MESSAGE}`);
    }
  });

  it(`throws error if another tag with the same new name already exists in the same organization and the same parent tag`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag?._id.toString() ?? "",
          name: testTag2?.name ?? "",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${TAG_ALREADY_EXISTS.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${TAG_ALREADY_EXISTS.MESSAGE}`);
    }
  });

  it(`updates the task with _id === args.id and returns it`, async () => {
    const args: MutationUpdateUserTagArgs = {
      input: {
        _id: testTag?._id.toString() ?? "",
        name: "NewName",
      },
    };
    const context = {
      userId: testUser?._id,
    };

    const { updateUserTag: updateUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/updateUserTag"
    );

    await updateUserTagResolver?.({}, args, context);

    const updatedTag = await OrganizationTagUser.findOne({
      _id: testTag?._id,
    }).lean();

    expect(updatedTag?.name).toEqual("NewName");
  });
  it("throws error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args: MutationUpdateUserTagArgs = {
      input: {
        _id: testTag?._id.toString() ?? "",
        name: "NewName",
      },
    };
    const newUser = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: newUser?.id,
    });
    const context = {
      userId: newUser?._id,
    };

    const { updateUserTag: updateUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/updateUserTag"
    );

    await OrganizationTagUser.updateOne(
      {
        _id: testTag?._id,
      },
      {
        $set: {
          appUserProfileId: null,
        },
      }
    );

    try {
      await updateUserTagResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });
});
