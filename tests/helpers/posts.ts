import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfacePost, InterfaceComment } from "../../src/models";
import { Post, Organization, Comment } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestPostType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfacePost & Document<any, any, InterfacePost>) | null;

export type TestCommentType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceComment & Document<any, any, InterfaceComment>) | null;

export const createTestPost = async (
  pinned = false,
): Promise<[TestUserType, TestOrganizationType, TestPostType]> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    creatorId: testUser?._id,
    organization: testOrganization?._id,
    pinned,
  });

  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        posts: testPost._id,
      },
    },
  );

  return [testUser, testOrganization, testPost];
};

export const createPostwithComment = async (): Promise<
  [TestUserType, TestOrganizationType, TestPostType, TestCommentType]
> => {
  const [testUser, testOrganization, testPost] = await createTestPost();

  const testComment = await Comment.create({
    text: `commentName${nanoid().toLowerCase()}`,
    creatorId: testUser && testUser._id,
    postId: testPost && testPost._id,
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
    },
  );

  await Comment.updateOne(
    {
      _id: testComment._id,
    },
    {
      $push: {
        likedBy: testUser && testUser._id,
      },
      $inc: {
        likeCount: 1,
      },
    },
  );
  return [testUser, testOrganization, testPost, testComment];
};

export const createSinglePostwithComment = async (
  userId: string,
  organizationId: string,
): Promise<[TestPostType, TestCommentType]> => {
  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    title: `title${nanoid()}`,
    imageUrl: `imageUrl${nanoid()}`,
    videoUrl: `videoUrl${nanoid()}`,
    creatorId: userId,
    organization: organizationId,
  });

  const testComment = await Comment.create({
    text: `commentName${nanoid().toLowerCase()}`,
    creatorId: userId,
    postId: testPost._id,
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
    },
  );
  return [testPost, testComment];
};

export const createTestSinglePost = async (
  userId: string,
  organizationId: string,
  pinned = false,
): Promise<TestPostType> => {
  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    title: `title${nanoid()}`,
    imageUrl: `imageUrl${nanoid()}`,
    videoUrl: `videoUrl${nanoid()}`,
    creatorId: userId,
    organization: organizationId,
    pinned,
  });
  return testPost;
};
