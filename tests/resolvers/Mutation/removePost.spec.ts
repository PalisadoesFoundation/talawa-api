import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization, Post } from "../../../src/models";
import { MutationRemovePostArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { removePost as removePostResolver } from "../../../src/resolvers/Mutation/removePost";
import {
  POST_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { testPostType } from "../../helpers/posts";
import { createTestUserFunc } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUsers: testUserType[];
let testPost: testPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2];

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]!._id,
    admins: [testUsers[0]!._id],
    members: [testUsers[0]!._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUsers[0]!._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testPost = await Post.create({
    text: "text",
    creator: testUsers[0]!._id,
    organization: testOrganization._id,
    likedBy: [testUsers[0]!._id],
    likeCount: 1,
  });
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removePost", () => {
  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationRemovePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationRemovePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUsers[0]!.id,
      };

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if for creator of post with _id === args.id,
  user._id !== context.userId`, async () => {
    try {
      const args: MutationRemovePostArgs = {
        id: testPost!.id,
      };

      const context = {
        userId: testUsers[1]!.id,
      };

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the post with _id === args.id and returns it`, async () => {
    const args: MutationRemovePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUsers[0]!.id,
    };

    const removePostPayload = await removePostResolver?.({}, args, context);

    expect(removePostPayload).toEqual(testPost!.toObject());
  });
});
