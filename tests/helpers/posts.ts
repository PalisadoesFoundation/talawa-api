import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import type { InterfaceComment, InterfacePost } from "../../src/models";
import { Comment, Organization, Post, File } from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";

export type TestPostType =
  | (InterfacePost & Document<unknown, unknown, InterfacePost>)
  | null;

export type TestCommentType =
  | (InterfaceComment & Document<unknown, unknown, InterfaceComment>)
  | null;

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

export const createTestPostWithMedia = async (
  userId: string,
  organizationId: string,
  pinned = false,
): Promise<TestPostType> => {
  const testFile = await File.create({
    fileName: `test-file-${nanoid()}.jpg`,
    mimeType: "image/jpeg",
    size: 1024,
    hash: {
      value: "66465102d50336a0610af4ae66d531cc",
      algorithm: "sha256",
    },
    uri: "https://example.com/test-file.jpg",
    metadata: {
      description: "Test file for post",
      objectKey: "test-file-object-key",
    },
  });

  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    title: `title${nanoid()}`,
    creatorId: userId,
    organization: organizationId,
    pinned,
    file: testFile,
  });
  return testPost;
};
