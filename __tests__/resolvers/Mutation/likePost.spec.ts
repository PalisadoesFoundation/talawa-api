import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Post,
  Interface_Post,
} from "../../../src/lib/models";
import { MutationLikePostArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { likePost as likePostResolver } from "../../../src/lib/resolvers/Mutation/likePost";
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
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> likePost", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationLikePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationLikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`updates likedBy and likeCount fields on post object with _id === args.id and
  returns it `, async () => {
    const args: MutationLikePostArgs = {
      id: testPost.id,
    };

    const context = {
      userId: testUser.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });

  it(`returns post object with _id === args.id without liking the post if user with
  _id === context.userId has already liked it.`, async () => {
    const args: MutationLikePostArgs = {
      id: testPost.id,
    };

    const context = {
      userId: testUser.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });
});
