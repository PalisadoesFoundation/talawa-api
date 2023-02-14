import "dotenv/config";
import { post as postResolver } from "../../../src/resolvers/Query/post";
import { Post } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { Types } from "mongoose";
import { POST_NOT_FOUND } from "../../../src/constants";
import { QueryPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testPostType, createPostwithComment } from "../../helpers/posts";

let testPost: testPostType;

beforeAll(async () => {
  await connect();
  testPost = (await createPostwithComment())[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> post", () => {
  it("throws NotFoundError if no post exists with _id === args.id", async () => {
    try {
      const args: QueryPostArgs = {
        id: Types.ObjectId().toString(),
      };

      await postResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`returns post object`, async () => {
    const args: QueryPostArgs = {
      id: testPost?._id,
    };

    const postPayload = await postResolver?.({}, args, {});

    const post = await Post.findOne({ _id: testPost?._id })
      .populate("organization")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("likedBy")
      .populate("creator", "-password")
      .lean();

    expect(postPayload).toEqual(post);
  });

  it(`returns post object with post.likeCount === 0 and post.commentCount === 0`, async () => {
    await Post.updateOne(
      {
        _id: testPost?._id,
      },
      {
        $set: {
          likedBy: [],
          comments: [],
        },
        $inc: {
          likeCount: -1,
          commentCount: -1,
        },
      }
    );

    const args: QueryPostArgs = {
      id: testPost?._id,
    };

    const postPayload = await postResolver?.({}, args, {});

    const post = await Post.findOne({ _id: testPost?._id })
      .populate("organization")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("likedBy")
      .populate("creator", "-password")
      .lean();

    expect(postPayload).toEqual(post);
  });
});
