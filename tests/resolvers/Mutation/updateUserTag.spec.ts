import "dotenv/config";
import { Types } from "mongoose";
import { MutationUpdateUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  NO_CHANGE_IN_TAG_NAME,
  TAG_ALREADY_EXISTS,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { createTestUser, testUserType } from "../../helpers/userAndOrg";
import { TestUserTagType, createRootTagsWithOrg } from "../../helpers/tags";
import { OrganizationTagUser } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;

let testUser: testUserType;
let testTag: TestUserTagType, testTag2: TestUserTagType;
let randomUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , [testTag, testTag2]] = await createRootTagsWithOrg(2);
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
          _id: testTag!._id.toString(),
          name: "NewName",
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
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
        userId: testUser!._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
    }
  });

  it(`throws error if current name of the tag and the new name is the same`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag!._id.toString(),
          name: testTag!.name,
        },
      };

      const context = {
        userId: testUser!._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${NO_CHANGE_IN_TAG_NAME.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${NO_CHANGE_IN_TAG_NAME.MESSAGE}`);
    }
  });

  it(`throws error if another tag with the same new name already exists in the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTagArgs = {
        input: {
          _id: testTag!._id.toString(),
          name: testTag2!.name,
        },
      };

      const context = {
        userId: testUser!._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${TAG_ALREADY_EXISTS.MESSAGE}`);
      expect(spy).toHaveBeenLastCalledWith(`${TAG_ALREADY_EXISTS.MESSAGE}`);
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
          _id: testTag!._id.toString(),
          name: "NewName",
        },
      };

      const context = {
        userId: randomUser!._id,
      };

      const { updateUserTag: updateUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserTag"
      );

      await updateUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`updates the task with _id === args.id and returns it`, async () => {
    const args: MutationUpdateUserTagArgs = {
      input: {
        _id: testTag!._id.toString(),
        name: "NewName",
      },
    };
    const context = {
      userId: testUser!._id,
    };

    const { updateUserTag: updateUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/updateUserTag"
    );

    await updateUserTagResolver?.({}, args, context);

    const updatedTag = await OrganizationTagUser.findOne({
      _id: testTag!._id,
    }).lean();

    expect(updatedTag!.name).toEqual("NewName");
  });
});
