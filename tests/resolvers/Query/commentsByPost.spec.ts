import "dotenv/config";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { commentsByPost as commentsByPostResolver } from "../../../src/resolvers/Query/commentsByPost";
import { Comment, Post, User, Organization } from "../../../src/models";
import { Types } from "mongoose";
import {
  COMMENT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  POST_NOT_FOUND,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { QueryCommentsByPostArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createPostwithComment, testPostType } from "../../helpers/posts";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testPost: testPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const resultArray = await createPostwithComment();
  testUser = resultArray[0];
  testOrganization = resultArray[1];
  testPost = resultArray[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> commentsByPost", () => {
  it(`returns list of all comments for post with _id === args.id
  populated with creator, post and likedBy`, async () => {
    const args: QueryCommentsByPostArgs = {
      id: testPost?._id,
    };

    const commentsByPostPayload = await commentsByPostResolver?.({}, args, {});

    const commentsByPost = await Comment.find({
      post: testPost?._id,
    })
      .populate("creator", "-password")
      .populate("post")
      .populate("likedBy")
      .lean();

    expect(commentsByPostPayload).toEqual(commentsByPost);
  });

  it(`throws NotFoundError if no organization exists with _id === post.organization
  for post with _id === args.id`, async () => {
    try {
      await Organization.deleteOne({
        _id: testOrganization?._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost?._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      await Post.deleteOne({
        _id: testPost?._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost?._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no creator exists for first comment for 
   post with id === args.id`, async () => {
    try {
      await User.deleteOne({
        _id: testUser?._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost?._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no comment exists for post with 
   _id === args.id`, async () => {
    try {
      const args: QueryCommentsByPostArgs = {
        id: Types.ObjectId().toString(),
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(COMMENT_NOT_FOUND);
    }
  });
});
