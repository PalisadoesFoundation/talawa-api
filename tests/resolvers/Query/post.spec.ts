import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE_URL, POST_NOT_FOUND_ERROR } from "../../../src/constants";
import { Post } from "../../../src/models";
import { post as postResolver } from "../../../src/resolvers/Query/post";
import type { QueryPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type { TestPostType } from "../../helpers/posts";
import { createPostwithComment } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPost: TestPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testPost = (await createPostwithComment())[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> post", () => {
  it("throws NotFoundError if no post exists with _id === args.id", async () => {
    try {
      const args: QueryPostArgs = {
        id: Types.ObjectId().toString(),
      };

      await postResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(POST_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns post object`, async () => {
    const args: QueryPostArgs = {
      id: testPost?._id,
    };
    const context = {
      apiRootUrl: BASE_URL,
    };

    const postPayload = await postResolver?.({}, args, context);

    const post = await Post.findOne({ _id: testPost?._id })
      .populate("organization")
      .populate("likedBy")
      .lean();

    if (post) {
      post.imageUrl = null;
      post.videoUrl = null;
    }

    expect(postPayload).toEqual(post);
    expect(postPayload?.imageUrl).toEqual(
      post?.imageUrl ? `${context.apiRootUrl}${post?.imageUrl}` : null,
    );
    expect(postPayload?.videoUrl).toEqual(
      post?.videoUrl ? `${context.apiRootUrl}${post?.videoUrl}` : null,
    );
  });
});
