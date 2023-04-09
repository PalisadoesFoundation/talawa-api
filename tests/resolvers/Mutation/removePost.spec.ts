import "dotenv/config";
import { Types } from "mongoose";
import { MutationRemovePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createTestUser, TestUserType } from "../../helpers/userAndOrg";
import { TestPostType, createTestPost } from "../../helpers/posts";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: TestUserType;
let testPost: TestPostType;
let randomUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removePost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws UnauthorizedError if a non-creator / non-superadmin / non-admin of the org tries to delete the post`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationRemovePostArgs = {
        id: testPost!.id,
      };

      const context = {
        userId: randomUser!.id,
      };

      const { removePost: removePostResolver } = await import(
        "../../../src/resolvers/Mutation/removePost"
      );

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`deletes the post with _id === args.id and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationRemovePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const { removePost: removePostResolver } = await import(
      "../../../src/resolvers/Mutation/removePost"
    );

    const removePostPayload = await removePostResolver?.({}, args, context);
    expect(removePostPayload).toEqual(testPost!.toObject());
  });
});
