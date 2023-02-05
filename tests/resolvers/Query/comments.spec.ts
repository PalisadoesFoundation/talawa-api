import "dotenv/config";
import { comments as commentsResolver } from "../../../src/resolvers/Query/comments";
import { connect, disconnect } from "../../../src/db";
import { Comment} from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createPostwithComment } from "../../helpers/posts";
beforeAll(async () => {
  await connect();

  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const [testPost, testComment] = await createPostwithComment(testUser._id, testOrganization._id);
});

afterAll(async () => {
  await disconnect();
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
