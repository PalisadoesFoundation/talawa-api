import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Post,
  Post,
} from "../../../src/models";
import { MutationRemovePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removePost as removePostResolver } from "../../../src/resolvers/Mutation/removePost";
import {
  POST_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];
let testPost: Interface_Post & Document<any, any, Interface_Post>;

beforeAll(async () => {
  await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[0]._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
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
    creator: testUsers[0]._id,
    organization: testOrganization._id,
    likedBy: [testUsers[0]._id],
    likeCount: 1,
  });
});

afterAll(async () => {
  await disconnect();
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
        userId: testUsers[0].id,
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
        id: testPost.id,
      };

      const context = {
        userId: testUsers[1].id,
      };

      await removePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the post with _id === args.id and returns it`, async () => {
    const args: MutationRemovePostArgs = {
      id: testPost.id,
    };

    const context = {
      userId: testUsers[0].id,
    };

    const removePostPayload = await removePostResolver?.({}, args, context);

    expect(removePostPayload).toEqual(testPost.toObject());
  });
});
