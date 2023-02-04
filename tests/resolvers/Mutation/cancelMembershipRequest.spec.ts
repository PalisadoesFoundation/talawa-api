import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { MutationCancelMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { cancelMembershipRequest as cancelMembershipRequestResolver } from "../../../src/resolvers/Mutation/cancelMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestMembershipRequestAsNew,
  testMembershipRequestType,
} from "../../helpers/membershipRequests";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testMembershipRequest: testMembershipRequestType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultsArray = await createTestMembershipRequestAsNew();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testMembershipRequest = resultsArray[2];
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest!.id,
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest!.id,
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
          _id: testMembershipRequest!._id,
        },
        {
          $set: {
            user: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest!.id,
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
        _id: testMembershipRequest!._id,
      },
      {
        $set: {
          user: testUser!._id,
        },
      }
    );

    const args: MutationCancelMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const cancelMembershipRequestPayload =
      await cancelMembershipRequestResolver?.({}, args, context);

    expect(cancelMembershipRequestPayload).toEqual(
      testMembershipRequest!.toObject()
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
