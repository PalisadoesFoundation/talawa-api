import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  User,
  Organization,
  MembershipRequest,
  TransactionLog,
} from "../../../src/models";
import type { MutationCancelMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { cancelMembershipRequest as cancelMembershipRequestResolver } from "../../../src/resolvers/Mutation/cancelMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequestAsNew } from "../../helpers/membershipRequests";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { wait } from "./acceptAdmin.spec";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestMembershipRequestAsNew();

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  testMembershipRequest = resultsArray[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> cancelMembershipRequest", () => {
  it(`throws NotFoundError if no membershipRequest exists with _id === args.membershipRequestId`, async () => {
    try {
      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === membershipRequest.organzation
  for membershipRequest with _id === args.membershipRequestId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            organization: testOrganization?._id,
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of membershipRequest with _id === args.membershipRequest`, async () => {
    try {
      await MembershipRequest.updateOne(
        {
          _id: testMembershipRequest?._id,
        },
        {
          $set: {
            user: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCancelMembershipRequestArgs = {
        membershipRequestId: testMembershipRequest?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await cancelMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`deletes membershipRequest and returns it`, async () => {
    await MembershipRequest.updateOne(
      {
        _id: testMembershipRequest?._id,
      },
      {
        $set: {
          user: testUser?._id,
        },
      }
    );

    const args: MutationCancelMembershipRequestArgs = {
      membershipRequestId: testMembershipRequest?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const cancelMembershipRequestPayload =
      await cancelMembershipRequestResolver?.({}, args, context);

    expect(cancelMembershipRequestPayload).toEqual(
      testMembershipRequest?.toObject()
    );

    const testUpdatedUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedUser?.membershipRequests).toEqual([]);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["membershipRequests"])
      .lean();

    expect(testUpdatedOrganization?.membershipRequests).toEqual([]);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(3);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });

    expect(mostRecentTransactions[1]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "Organization",
    });

    expect(mostRecentTransactions[2]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "MembershipRequest",
    });
  });
});
