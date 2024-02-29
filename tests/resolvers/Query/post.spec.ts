import "dotenv/config";
import { post as postResolver } from "../../../src/resolvers/Query/post";
import { connect, disconnect } from "../../helpers/db";
import { Post } from "../../../src/models";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { POST_NOT_FOUND_ERROR } from "../../../src/constants";
import type { QueryPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
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
        id: new Types.ObjectId().toString(),
      };

      await postResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns post object`, async () => {
    const args: QueryPostArgs = {
      id: testPost?._id,
    };

    const postPayload = await postResolver?.({}, args, {});

    const post = await Post.findOne({ _id: testPost?._id })
      .populate("organization")
      .populate("likedBy")
      .lean();

    expect(postPayload).toEqual(post);
  });
});
