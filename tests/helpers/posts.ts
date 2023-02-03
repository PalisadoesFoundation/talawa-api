import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";
import { Interface_Post, Post, Organization } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type testPostType =
  | (Interface_Post & Document<any, any, Interface_Post>)
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
