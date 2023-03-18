import "dotenv/config";
import { Types } from "mongoose";
import { MutationAssignUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION,
  USER_ALREADY_HAS_TAG,
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
import { TestUserTagType, createRootTagWithOrg } from "../../helpers/tags";
import { TagUser } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose | null;

let adminUser: testUserType;
let testTag: TestUserTagType;
let randomUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [adminUser, , testTag] = await createRootTagWithOrg();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
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
          userId: Types.ObjectId().toString(),
          tagId: testTag!._id.toString(),
        },
      };

      const context = { userId: adminUser!._id };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
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
          userId: adminUser!._id,
          tagId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser!._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
    }
  });

  it(`throws Not Authorized Error if the user is not a superadmin or admin of the organization of the tag beind assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };

      const context = {
        userId: randomUser!._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws Error if the user being assigned have not joined the  organization of the tag beind assigned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: randomUser!._id,
          tagId: testTag!._id.toString(),
        },
      };

      const context = {
        userId: adminUser!._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_BELONG_TO_TAGS_ORGANIZATION.MESSAGE}`
      );
    }
  });

  it(`tag assign should be successful`, async () => {
    const args: MutationAssignUserTagArgs = {
      input: {
        userId: adminUser!._id,
        tagId: testTag!._id.toString(),
      },
    };
    const context = {
      userId: adminUser!._id,
    };

    const { assignUserTag: assignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/assignUserTag"
    );

    await assignUserTagResolver?.({}, args, context);

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    expect(tagAssigned).toBeTruthy();
  });

  it(`tag assign should give USER_ALREADY_HAS_TAG error if the request tries to reassign the same tag again to the user`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAssignUserTagArgs = {
        input: {
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };
      const context = {
        userId: adminUser!._id,
      };

      const { assignUserTag: assignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/assignUserTag"
      );

      await assignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_ALREADY_HAS_TAG.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${USER_ALREADY_HAS_TAG.MESSAGE}`);
    }
  });
});
