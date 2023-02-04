import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationUnblockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { unblockUser as unblockUserResolver } from "../../../src/resolvers/Mutation/unblockUser";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
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
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> unblockUser", () => {
  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: "",
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization.id,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: "",
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId does not exist
  in blockedUsers list of organization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            admins: testUser._id,
          },
        }
      );

      await User.updateOne(
        {
          _id: testUser.id,
        },
        {
          $push: {
            adminFor: testOrganization._id,
          },
        }
      );

      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes the user with _id === args.userId from blockedUsers list of the
  organization with _id === args.organizationId and returns the updated user`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $push: {
          blockedUsers: testUser._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser.id,
      },
      {
        $push: {
          organizationsBlockedBy: testOrganization._id,
        },
      }
    );

    const args: MutationUnblockUserArgs = {
      organizationId: testOrganization.id,
      userId: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const unblockUserPayload = await unblockUserResolver?.({}, args, context);

    const testUnblockUserPayload = await User.findOne({
      _id: testUser.id,
    })
      .select(["-password"])
      .lean();

    expect(unblockUserPayload).toEqual(testUnblockUserPayload);
  });
});
