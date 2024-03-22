import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { MembershipRequest, Organization, User } from "../../../src/models";
import type { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  MEMBERSHIP_REQUEST_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { createTestUser } from "../../helpers/user";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

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
        organizationId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
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
      const tempUser = await createTestUser();
      const context = {
        userId: tempUser?._id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        MEMBERSHIP_REQUEST_NOT_FOUND_ERROR.MESSAGE,
      );
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
      },
    );

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          membershipRequests: [],
        },
      },
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
      context,
    );

    expect(sendMembershipRequestPayload).toEqual(
      expect.objectContaining({
        user: testUser?._id,
        organization: testOrganization?._id,
      }),
    );
  });
});
