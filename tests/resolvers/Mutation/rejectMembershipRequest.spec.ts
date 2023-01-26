import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  MembershipRequest,
  Interface_MembershipRequest,
} from "../../../src/models";
import { MutationRejectMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { rejectMembershipRequest as rejectMembershipRequestResolver } from "../../../src/resolvers/Mutation/rejectMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: (Interface_User & Document<any, any, Interface_User>) | null;
let testOrganization:
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;
let testMembershipRequest: Interface_MembershipRequest &
  Document<any, any, Interface_MembershipRequest>;

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
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testMembershipRequest = await MembershipRequest.create({
    user: testUser._id,
    organization: testOrganization._id,
  });

  testUser = await User.findOneAndUpdate(
    {
      _id: testUser._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );

  testOrganization = await Organization.findOneAndUpdate(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> rejectMembershipRequest", () => {
  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    try {
      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === membershipRequest.organzation
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === membershipRequest.user
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest._id,
        },
        {
          $set: {
            user: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organzation with _id === membershipRequest.organzation for membershipRequest 
  with _id === args.membershipRequestId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest._id,
        },
        {
          $set: {
            user: testUser!._id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRejectMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await rejectMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes membershipRequest with _id === args.membershipRequestId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    const args: MutationRejectMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const rejectMembershipRequestPayload =
      await rejectMembershipRequestResolver?.({}, args, context);

    expect(rejectMembershipRequestPayload).toEqual(
      testMembershipRequest.toObject()
    );

    const testUpdatedUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedUser?.membershipRequests).toEqual([]);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedOrganization?.membershipRequests).toEqual([]);
  });
});
