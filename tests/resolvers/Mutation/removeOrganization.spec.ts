import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Post,
  Comment,
  MembershipRequest,
  Interface_Comment,
  Interface_Post,
} from "../../../src/models";
import { MutationRemoveOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeOrganization as removeOrganizationResolver } from "../../../src/resolvers/Mutation/removeOrganization";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testPost: Interface_Post & Document<any, any, Interface_Post>;
let testComment: Interface_Comment & Document<any, any, Interface_Comment>;

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

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[1]._id],
    blockedUsers: [testUsers[0]._id],
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
        organizationsBlockedBy: [testOrganization._id],
      },
    }
  );

  await User.updateOne(
    {
      _id: testUsers[1]._id,
    },
    {
      $set: {
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testMembershipRequest = await MembershipRequest.create({
    organization: testOrganization._id,
    user: testUsers[0]._id,
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  testPost = await Post.create({
    text: "text",
    creator: testUsers[0]._id,
    organization: testOrganization._id,
  });

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
        posts: testPost._id,
      },
    }
  );

  testComment = await Comment.create({
    text: "text",
    creator: testUsers[0]._id,
    post: testPost._id,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $push: {
        comments: testComment._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> removeOrganization", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveOrganizationArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveOrganizationArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUsers[0].id,
      };

      await removeOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId
  is not the creator of organization with _id === args.id`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveOrganizationArgs = {
        id: testOrganization.id,
      };

      const context = {
        userId: testUsers[0].id,
      };

      await removeOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes the organization and returns the updated user's object with _id === context.userId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          creator: testUsers[0]._id,
        },
      }
    );

    const args: MutationRemoveOrganizationArgs = {
      id: testOrganization._id,
    };

    const context = {
      userId: testUsers[0]._id,
    };

    const removeOrganizationPayload = await removeOrganizationResolver?.(
      {},
      args,
      context
    );

    const updatedTestUser = await User.findOne({
      _id: testUsers[0]._id,
    })
      .select(["-password"])
      .lean();

    expect(removeOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestUser1 = await User.findOne({
      _id: testUsers[1]._id,
    })
      .select(["joinedOrganizations"])
      .lean();

    expect(updatedTestUser1?.joinedOrganizations).toEqual([]);

    const deletedMembershipRequests = await MembershipRequest.find({
      organization: testOrganization._id,
    }).lean();

    const deletedTestPosts = await Post.find({
      _id: testPost._id,
    }).lean();

    const deletedTestComments = await Comment.find({
      _id: testComment._id,
    }).lean();

    expect(deletedMembershipRequests).toEqual([]);

    expect(deletedTestPosts).toEqual([]);

    expect(deletedTestComments).toEqual([]);
  });
});
