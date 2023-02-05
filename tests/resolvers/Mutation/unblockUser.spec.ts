import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationUnblockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { unblockUser as unblockUserResolver } from "../../../src/resolvers/Mutation/unblockUser";
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> unblockUser", () => {
  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: "",
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization!.id,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: "",
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId does not exist
  in blockedUsers list of organization with _id === args.organizationId`, async () => {
    try {
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

      await User.updateOne(
        {
          _id: testUser!.id,
        },
        {
          $push: {
            adminFor: testOrganization!._id,
          },
        }
      );

      const args: MutationUnblockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await unblockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes the user with _id === args.userId from blockedUsers list of the
  organization with _id === args.organizationId and returns the updated user`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          blockedUsers: testUser!._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!.id,
      },
      {
        $push: {
          organizationsBlockedBy: testOrganization!._id,
        },
      }
    );

    const args: MutationUnblockUserArgs = {
      organizationId: testOrganization!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const unblockUserPayload = await unblockUserResolver?.({}, args, context);

    const testUnblockUserPayload = await User.findOne({
      _id: testUser!.id,
    })
      .select(["-password"])
      .lean();

    expect(unblockUserPayload).toEqual(testUnblockUserPayload);
  });
});
