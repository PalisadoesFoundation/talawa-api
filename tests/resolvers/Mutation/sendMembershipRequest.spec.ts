import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import {
  MEMBERSHIP_REQUEST_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import {
  createTestMembershipRequest,
  testMembershipRequestType,
} from "../../helpers/membershipRequests";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testMembershipRequest: testMembershipRequestType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testUser = temp[0];
  testOrganization = temp[1];
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> sendMembershipRequest", () => {
  it(`throws NotFoundError if the current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws ConflictError if a membershipRequest with fields user === context.userId
  and organization === args.organizationId already exists`, async () => {
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBERSHIP_REQUEST_ALREADY_EXISTS);
    }
  });

  it(`creates new membershipRequest and returns it`, async () => {
    await MembershipRequest.deleteOne({
      _id: testMembershipRequest!._id,
    });

    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      }
    );

    const args: MutationSendMembershipRequestArgs = {
      organizationId: testOrganization!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const sendMembershipRequestPayload = await sendMembershipRequestResolver?.(
      {},
      args,
      context
    );

    expect(sendMembershipRequestPayload).toEqual(
      expect.objectContaining({
        user: testUser!._id,
        organization: testOrganization!._id,
      })
    );
  });
});
