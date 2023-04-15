import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import {
  InterfacePost,
  Post,
  Organization,
  Comment,
  InterfaceComment,
  CommentPost,
} from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestPostType =
  | (InterfacePost & Document<any, any, InterfacePost>)
  | null;

export type TestCommentType =
  | (InterfaceComment & Document<any, any, InterfaceComment>)
  | null;

export const createTestPost = async (
  pinned: boolean = false
): Promise<[TestUserType, TestOrganizationType, TestPostType]> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    creator: testUser!._id,
    organization: testOrganization!._id,
    pinned,
  });

  await Organization.updateOne(
    {
      _id: testOrganization!._id,
    },
    {
      $push: {
        posts: testPost._id,
      },
    }
  );

  return [testUser, testOrganization, testPost];
};

export const createPostwithComment = async (): Promise<
  [TestUserType, TestOrganizationType, TestPostType, TestCommentType]
> => {
  const [testUser, testOrganization, testPost] = await createTestPost();

  const testComment = await Comment.create({
    text: `commentName${nanoid().toLowerCase()}`,
    creator: testUser?._id,
  });

  await CommentPost.create({
    commentId: testComment._id,
    postId: testPost!._id,
  });

  await Post.updateOne(
    {
      _id: testPost?._id,
    },
    {
      $push: {
        likedBy: testUser?._id,
      },
      $inc: {
        likeCount: 1,
        commentCount: 1,
      },
    }
  );

  await Comment.updateOne(
    {
      _id: testComment._id,
    },
    {
      $push: {
        likedBy: testUser?._id,
      },
      $inc: {
        likeCount: 1,
      },
    }
  );
  return [testUser, testOrganization, testPost, testComment];
};

export const createSinglePostwithComment = async (
  userId: string,
  organizationId: string
): Promise<[TestPostType, TestCommentType]> => {
  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    title: `title${nanoid()}`,
    imageUrl: `imageUrl${nanoid()}`,
    videoUrl: `videoUrl${nanoid()}`,
    creator: userId,
    organization: organizationId,
  });

  const testComment = await Comment.create({
    text: `commentName${nanoid().toLowerCase()}`,
    creator: userId,
  });

  await CommentPost.create({
    commentId: testComment._id,
    postId: testPost!._id,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $push: {
        likedBy: userId,
      },
      $inc: {
        likeCount: 1,
        commentCount: 1,
      },
    }
  );
  return [testPost, testComment];
};

export const createTestSinglePost = async (
  userId: string,
  organizationId: string,
  pinned = false
): Promise<TestPostType> => {
  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    title: `title${nanoid()}`,
    imageUrl: `imageUrl${nanoid()}`,
    videoUrl: `videoUrl${nanoid()}`,
    creator: userId,
    organization: organizationId,
    pinned,
  });
  return testPost;
};
