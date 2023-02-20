import "dotenv/config";
import { comments as commentsResolver } from "../../../src/resolvers/Query/comments";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Comment } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createPostwithComment } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createPostwithComment();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> comments", () => {
  it(`returns list of all existing comments with populated fields:- creator
    , post, likedBy`, async () => {
    const comments = await Comment.find()
      .populate("creator", "-password")
      .populate("post")
      .populate("likedBy")
      .lean();

    const commentsPayload = await commentsResolver?.({}, {}, {});

    expect(commentsPayload).toEqual(comments);
  });
});
