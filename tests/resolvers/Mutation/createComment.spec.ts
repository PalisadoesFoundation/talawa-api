import "dotenv/config";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import { MutationCreateCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createComment as createCommentResolver } from "../../../src/resolvers/Mutation/createComment";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestPost, testPostType } from "../../helpers/posts";
import { testUserType } from "../../helpers/userAndOrg";

let testUser: testUserType;
let testPost: testPostType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const resultsArray = await createTestPost();
  testUser = resultsArray[0];
  testPost = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createComment", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateCommentArgs = {
        data: {
          text: "",
        },
        postId: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`creates the comment and returns it`, async () => {
    const args: MutationCreateCommentArgs = {
      data: {
        text: "text",
      },
      postId: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const createCommentPayload = await createCommentResolver?.(
      {},
      args,
      context
    );

    expect(createCommentPayload).toEqual(
      expect.objectContaining({
        text: "text",
        creator: testUser!._id,
        post: testPost!._id,
      })
    );

    const testUpdatedPost = await Post.findOne({
      _id: testPost!._id,
    })
      .select(["comments", "commentCount"])
      .lean();

    expect(testUpdatedPost!.comments).toEqual([createCommentPayload?._id]);
    expect(testUpdatedPost!.commentCount).toEqual(1);
  });
});
