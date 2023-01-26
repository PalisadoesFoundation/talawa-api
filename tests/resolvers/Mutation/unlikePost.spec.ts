import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Post,
  Post,
} from "../../../src/models";
import { MutationUnlikePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { unlikePost as unlikePostResolver } from "../../../src/resolvers/Mutation/unlikePost";
import { POST_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testPost: Interface_Post & Document<any, any, Interface_Post>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
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
    creator: testUser._id,
    organization: testOrganization._id,
    likedBy: [testUser._id],
    likeCount: 1,
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> unlikePost", () => {
  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationUnlikePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await unlikePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationUnlikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
      };

      await unlikePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`removes current user with _id === context.userId from likedBy list
  on post with _id === args.id`, async () => {
    const args: MutationUnlikePostArgs = {
      id: testPost._id,
    };

    const context = {
      userId: testUser._id,
    };

    const unlikePostPayload = await unlikePostResolver?.({}, args, context);

    const testUnlikePostPayload = await Post.findOne({
      _id: testPost._id,
    }).lean();

    expect(unlikePostPayload).toEqual(testUnlikePostPayload);
  });

  it(`returns the post with _id === args.id without any mutation if current user
  with _id === context.userId does not exist in likedBy list of the post`, async () => {
    const args: MutationUnlikePostArgs = {
      id: testPost._id,
    };

    const context = {
      userId: testUser._id,
    };

    const unlikePostPayload = await unlikePostResolver?.({}, args, context);

    const testUnlikePostPayload = await Post.findOne({
      _id: testPost._id,
    }).lean();

    expect(unlikePostPayload).toEqual(testUnlikePostPayload);
  });
});
