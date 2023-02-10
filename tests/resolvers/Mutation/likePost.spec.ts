import "dotenv/config";
import { Types } from "mongoose";
import { MutationLikePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { likePost as likePostResolver } from "../../../src/resolvers/Mutation/likePost";
import {
  POST_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
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
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;

beforeAll(async () => {
  await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> likePost", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLikePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });
      const { likePost: likePostResolver } = await import(
        "../../../src/resolvers/Mutation/likePost"
      );

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });

      const { likePost: likePostResolver } = await import(
        "../../../src/resolvers/Mutation/likePost"
      );

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(POST_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(POST_NOT_FOUND_MESSAGE);
    }
  });

  it(`updates likedBy and likeCount fields on post object with _id === args.id and
  returns it `, async () => {
    const args: MutationLikePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser!._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });

  it(`returns post object with _id === args.id without liking the post if user with
  _id === context.userId has already liked it.`, async () => {
    const args: MutationLikePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser!._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });
});
