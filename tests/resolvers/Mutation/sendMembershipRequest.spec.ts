import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  User,
  Organization,
  MembershipRequest,
  TransactionLog,
} from "../../../src/models";
import type { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { wait } from "./acceptAdmin.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testMembershipRequest: TestMembershipRequestType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testUser = temp[0];
  testOrganization = temp[1];
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> sendMembershipRequest", () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if a membershipRequest with fields user === context.userId
  and organization === args.organizationId does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates new membershipRequest and returns it`, async () => {
    await MembershipRequest.deleteOne({
      _id: testMembershipRequest?._id,
    });

    await Organization.updateOne(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    const args: MutationSendMembershipRequestArgs = {
      organizationId: testOrganization?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const sendMembershipRequestPayload = await sendMembershipRequestResolver?.(
      {},
      args,
      context
    );

    expect(sendMembershipRequestPayload).toEqual(
      expect.objectContaining({
        user: testUser?._id,
        organization: testOrganization?._id,
      })
    );
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
      type: TRANSACTION_LOG_TYPES.CREATE,
      modelName: "MembershipRequest",
    });
  });
});
