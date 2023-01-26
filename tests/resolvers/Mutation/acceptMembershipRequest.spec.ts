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
import { MutationAcceptMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { acceptMembershipRequest as acceptMembershipRequestResolver } from "../../../src/resolvers/Mutation/acceptMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_ALREADY_MEMBER,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
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
    visibleInSearch: true,
  });

  testMembershipRequest = await MembershipRequest.create({
    user: testUser._id,
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        membershipRequests: testMembershipRequest._id,
      },
    }
  );

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> acceptMembershipRequest", () => {
  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    try {
      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === membershipRequest.organization
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

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser.id,
      };

      await acceptMembershipRequestResolver?.({}, args, context);
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
            organization: testOrganization._id,
            user: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser.id,
      };

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an
  admin of organization with _id === membershipRequest.organization for
  membershipRequest with _id === args.membershipRequestId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest._id,
        },
        {
          $set: {
            user: testUser.id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser.id,
      };

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws ConflictError if user with _id === membershipRequest.user is already
  a member of organization with _id === membershipRequest.organization for membershipRequest
  with _id === args.membershipRequestId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            admins: testUser._id,
            members: testUser._id,
          },
        }
      );

      const args: MutationAcceptMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest.id,
      };

      const context = {
        userId: testUser.id,
      };

      await acceptMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_MEMBER);
    }
  });

  it(`accepts the membershipRequest and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          members: [],
        },
      }
    );

    const args: MutationAcceptMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest.id,
    };

    const context = {
      userId: testUser.id,
    };

    const acceptMembershipRequestPayload =
      await acceptMembershipRequestResolver?.({}, args, context);

    expect(acceptMembershipRequestPayload).toEqual(
      testMembershipRequest.toObject()
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(["members", "membershipRequests"])
      .lean();

    expect(updatedTestOrganization).toEqual(
      expect.objectContaining({
        members: expect.arrayContaining([testUser._id]),
        membershipRequests: expect.arrayContaining([]),
      })
    );

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["joinedOrganizations", "membershipRequests"])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        joinedOrganizations: expect.arrayContaining([testOrganization._id]),
        membershipRequests: expect.arrayContaining([]),
      })
    );
  });
});
