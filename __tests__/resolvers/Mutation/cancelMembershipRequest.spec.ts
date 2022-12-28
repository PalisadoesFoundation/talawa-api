import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  MembershipRequest,
  Interface_MembershipRequest,
} from "../../../src/lib/models";
import { MutationCancelMembershipRequestArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { cancelMembershipRequest as cancelMembershipRequestResolver } from "../../../src/lib/resolvers/Mutation/cancelMembershipRequest";
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

describe("resolvers -> Mutation -> cancelMembershipRequest", () => {
  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    try {
      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
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

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
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

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of membershipRequest with _id === args.membershipRequest`, async () => {
    try {
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

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes membershipRequest and returns it`, async () => {
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

    const args: MutationCancelMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const cancelMembershipRequestPayload =
      await cancelMembershipRequestResolver?.({}, args, context);

    expect(cancelMembershipRequestPayload).toEqual(
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
