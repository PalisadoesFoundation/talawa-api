import type { TestUserType } from "./userAndOrg";
import type { InterfaceComment } from "../../src/models";
import { Comment } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import type { TestPostType} from "./posts";
import { createTestPost } from "./posts";

export type TestCommentType =
  | (InterfaceComment & Document<any, any, InterfaceComment>)
  | null;

export const createTestComment = async (): Promise<
  [TestUserType, TestPostType, TestCommentType]
> => {
  const resultsArray = await createTestPost();

  const testUser = resultsArray[0];
  const samplePost = resultsArray[2];

  const testComment = await Comment.create({
    text: `commentName${nanoid().toLowerCase()}`,
    creator: testUser && testUser._id,
    postId: samplePost && samplePost._id,
    status: "ACTIVE",
  });

  return [testUser, samplePost, testComment];
};
