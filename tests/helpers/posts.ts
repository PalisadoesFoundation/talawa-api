import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";
import { Interface_Post, Post, Organization, Comment,  Interface_Comment} from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type testPostType =
  | (Interface_Post & Document<any, any, Interface_Post>)
  | null;


export type testCommentType = 
  | (Interface_Comment & Document<any, any, Interface_Comment>)
  | null;


export const createTestPost = async (): Promise<
  [testUserType, testOrganizationType, testPostType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testPost = await Post.create({
    text: `text${nanoid().toLowerCase()}`,
    creator: testUser!._id,
    organization: testOrganization!._id,
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


export const createPostwithComment = async (
  user_id: string,
  organization_id: string
): Promise<[testPostType, testCommentType]> => {
  const testPost = await Post.create({
      text: `postName${nanoid().toLowerCase()}`,
      creator: user_id,
      organization: organization_id,
  });
  
  const testComment = await Comment.create({
  text: `commentName${nanoid().toLowerCase()}`,
  creator: user_id,
  post: testPost._id,
  });

  await Post.updateOne(
  {
      _id: testPost._id,
  },
  {
      $push: {
      comments: [testComment._id],
      },
      $inc: {
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
      likedBy: user_id,
      },
      $inc: {
      likeCount: 1,
      },
  }
  );
  return [testPost, testComment];
}