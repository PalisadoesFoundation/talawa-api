import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationLeaveOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { leaveOrganization as leaveOrganizationResolver } from "../../../src/resolvers/Mutation/leaveOrganization";
import {
  MEMBER_NOT_FOUND,
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
  await connect();

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
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> leaveOrganization", () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is the creator
  of organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws ConflictError if user with _id === context.userId is not a member
  of organization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
            members: [],
          },
        }
      );

      const args: MutationLeaveOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await leaveOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBER_NOT_FOUND);
    }
  });

  it(`returns user object with _id === context.userId after leaving the organization`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $push: {
          members: testUser._id,
        },
      }
    );

    const args: MutationLeaveOrganizationArgs = {
      organizationId: testOrganization.id,
    };

    const context = {
      userId: testUser.id,
    };

    const leaveOrganizationPayload = await leaveOrganizationResolver?.(
      {},
      args,
      context
    );

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["-password"])
      .lean();

    expect(leaveOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(["admins", "members"])
      .lean();

    expect(updatedTestOrganization!.admins).toEqual([]);
    expect(updatedTestOrganization!.members).toEqual([]);
  });
});
