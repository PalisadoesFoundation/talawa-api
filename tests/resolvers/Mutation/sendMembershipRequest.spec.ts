import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, MembershipRequest } from "../../../src/models";
import type { MutationSendMembershipRequestArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { sendMembershipRequest as sendMembershipRequestResolver } from "../../../src/resolvers/Mutation/sendMembershipRequest";
import {
  MEMBERSHIP_REQUEST_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";

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

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws AlreadyMemberError message if user with _id === context.userId is already a member of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const updatedOrganizaiton = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?.id,
        },
        {
          $set: {
            members: [testUser?.id],
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganizaiton !== null) {
        await cacheOrganizations([updatedOrganizaiton]);
      }

      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_ALREADY_MEMBER_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if the user is blocked from the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?.id,
        },
        {
          $pull: {
            members: testUser?.id,
          },
          $addToSet: {
            blockedUsers: testUser?.id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        cacheOrganizations([updatedOrganization]);
      }

      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`throws ConflictError message if a membershipRequest with fields user === context.userId
  and organization === args.organizationId already exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?.id,
        },
        {
          $pull: {
            blockedUsers: testUser?.id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        cacheOrganizations([updatedOrganization]);
      }

      const args: MutationSendMembershipRequestArgs = {
        organizationId: testOrganization?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMembershipRequest: sendMembershipRequestResolver } =
        await import("../../../src/resolvers/Mutation/sendMembershipRequest");

      await sendMembershipRequestResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(MEMBERSHIP_REQUEST_ALREADY_EXISTS.MESSAGE);
      expect((error as Error).message).toEqual(
        MEMBERSHIP_REQUEST_ALREADY_EXISTS.MESSAGE,
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
