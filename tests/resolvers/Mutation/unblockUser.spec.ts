import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { MembershipRequest, Organization, User } from "../../../src/models";
import type { MutationUnblockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { unblockUser as unblockUserResolver } from "../../../src/resolvers/Mutation/unblockUser";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUserAndOrganization,
  createTestUser,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  testUser2 = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> unblockUser", () => {
  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: new Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: "",
      };

      const { unblockUser: unblockUserResolver } = await import(
        "../../../src/resolvers/Mutation/unblockUser"
      );

      await unblockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization?.id,
        userId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { unblockUser: unblockUserResolver } = await import(
        "../../../src/resolvers/Mutation/unblockUser"
      );

      await unblockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { unblockUser: unblockUserResolver } = await import(
        "../../../src/resolvers/Mutation/unblockUser"
      );

      await unblockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId does not exist
  in blockedUsers list of organization with _id === args.organizationId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUser?._id,
          },
        },
      );

      await User.updateOne(
        {
          _id: testUser?.id,
        },
        {
          $push: {
            adminFor: testOrganization?._id,
          },
        },
      );

      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { unblockUser: unblockUserResolver } = await import(
        "../../../src/resolvers/Mutation/unblockUser"
      );

      await unblockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`removes the user with _id === args.userId from blockedUsers list of the
  organization with _id === args.organizationId set with userRegistrationRequired to true
  and returns the updated user`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          blockedUsers: testUser2?._id,
        },
        $set: {
          userRegistrationRequired: true,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (
      updatedOrganization !== null &&
      updatedOrganization.userRegistrationRequired === true
    ) {
      const createdMembershipRequest = await MembershipRequest.create({
        user: testUser2?._id,
        organization: testOrganization?._id,
      });

      const updatedOrganizaiton = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
        {
          new: true,
        },
      ).lean();

      await User.updateOne(
        {
          _id: testUser2?._id,
        },
        {
          $push: {
            membershipRequests: createdMembershipRequest._id,
          },
        },
      );

      if (updatedOrganizaiton !== null) {
        await cacheOrganizations([updatedOrganizaiton]);
      }
    }

    await User.updateOne(
      {
        _id: testUser2?.id,
      },
      {
        $push: {
          organizationsBlockedBy: testOrganization?._id,
        },
      },
    );

    const args: MutationUnblockUserArgs = {
      organizationId: testOrganization?.id,
      userId: testUser2?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const unblockUserPayload = await unblockUserResolver?.({}, args, context);

    const testUnblockUserPayload = await User.findOne({
      _id: testUser2?.id,
    })
      .select(["-password"])
      .lean();

    expect(unblockUserPayload).toEqual(testUnblockUserPayload);
  });

  it(`removes the user with _id === args.userId from blockedUsers list of the
  organization with _id === args.organizationId set with userRegistrationRequired to false
  and returns the updated user`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $push: {
          blockedUsers: testUser2?._id,
        },
        $set: {
          userRegistrationRequired: false,
        },
      },
      {
        new: true,
      },
    ).lean();

    if (
      updatedOrganization !== null &&
      updatedOrganization.userRegistrationRequired === false
    ) {
      await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser2?._id,
          },
        },
        {
          new: true,
        },
      ).lean();

      await User.updateOne(
        {
          _id: testUser2?._id,
        },
        {
          $push: {
            joinedOrganizations: testOrganization?._id,
          },
        },
      ).lean();
    }

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    await User.updateOne(
      {
        _id: testUser2?.id,
      },
      {
        $push: {
          organizationsBlockedBy: testOrganization?._id,
        },
      },
    );

    const args: MutationUnblockUserArgs = {
      organizationId: testOrganization?.id,
      userId: testUser2?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const unblockUserPayload = await unblockUserResolver?.({}, args, context);

    const testUnblockUserPayload = await User.findOne({
      _id: testUser2?.id,
    })
      .select(["-password"])
      .lean();

    expect(unblockUserPayload).toEqual(testUnblockUserPayload);
  });
});
