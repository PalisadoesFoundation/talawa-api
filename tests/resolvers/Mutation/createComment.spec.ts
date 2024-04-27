import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import type { MutationCreateCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createComment as createCommentResolver } from "../../../src/resolvers/Mutation/createComment";
import { POST_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testPost: TestPostType;
let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestPost();
  testUser = resultsArray[0];
  testPost = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createComment", () => {
  it(`throws NotFoundError if no post exists with _id === args.postId`, async () => {
    try {
      const args: MutationCreateCommentArgs = {
        data: {
          text: "",
        },
        postId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await createCommentResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(POST_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the comment and returns it`, async () => {
    const args: MutationCreateCommentArgs = {
      data: {
        text: "text",
      },
      postId: testPost?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const createCommentPayload = await createCommentResolver?.(
      {},
      args,
      context,
    );

    expect(createCommentPayload).toEqual(
      expect.objectContaining({
        text: "text",
      }),
    );

    const testUpdatedPost = await Post.findOne({
      _id: testPost?._id,
    })
      .select(["commentCount"])
      .lean();

    expect(testUpdatedPost?.commentCount).toEqual(1);
    expect(createCommentPayload?.postId.toString()).toEqual(
      testPost?._id.toString(),
    );
  });
});
