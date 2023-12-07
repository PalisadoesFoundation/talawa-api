import "dotenv/config";
import { Comment } from "../../../src/models";
import { commentsByPost as commentsByPostResolver } from "../../../src/resolvers/Query/commentsByPost";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { QueryCommentsByPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { createTestComment } from "../../helpers/comment";
import type { TestPostType } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPost: TestPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestComment();
  testPost = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> commentsByPost", () => {
  it(`returns a list of all comments for a post with postId === args.id`, async () => {
    const args: QueryCommentsByPostArgs = {
      id: testPost?._id,
    };

    const commentsByPostPayload = await commentsByPostResolver?.({}, args, {});

    const commentsByPostFound = await Comment.find({
      postId: testPost?._id,
    }).lean();

    expect(commentsByPostPayload).toEqual(commentsByPostFound);
  });
});
