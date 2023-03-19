import "dotenv/config";
import { Types } from "mongoose";
import { MutationUnassignUserTagArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  TAG_NOT_FOUND,
  USER_DOES_NOT_HAVE_THE_TAG,
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
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          tagId: testTag!._id.toString(),
        },
      };

      const context = { userId: adminUser!._id };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
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
      const args: MutationUnassignUserTagArgs = {
        input: {
          userId: adminUser!._id,
          tagId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: adminUser!._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TAG_NOT_FOUND.MESSAGE);
      expect(error.message).toEqual(`Translated ${TAG_NOT_FOUND.MESSAGE}`);
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
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };

      const context = {
        userId: randomUser!._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
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
          userId: adminUser!._id,
          tagId: testTag!._id.toString(),
        },
      };
      const context = {
        userId: adminUser!._id,
      };

      const { unassignUserTag: unassignUserTagResolver } = await import(
        "../../../src/resolvers/Mutation/unassignUserTag"
      );

      await unassignUserTagResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_DOES_NOT_HAVE_THE_TAG.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_DOES_NOT_HAVE_THE_TAG.MESSAGE}`
      );
    }
  });

  it(`tag unassign should be successful and the user who has been unassigned the tag is returned`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationUnassignUserTagArgs = {
      input: {
        userId: adminUser!._id,
        tagId: testTag!._id.toString(),
      },
    };
    const context = {
      userId: adminUser!._id,
    };

    // Assign the tag to the user
    await TagUser.create({
      ...args.input,
    });

    // Test the unassignUserTag resolver
    const { unassignUserTag: unassignUserTagResolver } = await import(
      "../../../src/resolvers/Mutation/unassignUserTag"
    );

    const payload = await unassignUserTagResolver?.({}, args, context);

    expect(payload!._id.toString()).toEqual(adminUser!._id.toString());

    const tagAssigned = await TagUser.exists({
      ...args.input,
    });

    expect(tagAssigned).toBeFalsy();
  });
});
