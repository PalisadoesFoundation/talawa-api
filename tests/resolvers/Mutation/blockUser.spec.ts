import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationBlockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { blockUser as blockUserResolver } from "../../../src/resolvers/Mutation/blockUser";
import {
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUser,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();

  testUser = await createTestUser();

  testOrganization = await Organization.create({
    name: `name${nanoid().toLowerCase()}`,
    description: `desc${nanoid().toLowerCase()}`,
    isPublic: true,
    creator: testUser!._id,
    members: [testUser!._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser!._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> blockUser", () => {
  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId is already blocked
  from organization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $push: {
            admins: testUser!._id,
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
            adminFor: testOrganization!._id,
          },
        }
      );

      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it(`blocks the user with _id === args.userId from the organization with
  _id === args.organizationId and returns the blocked user`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          blockedUsers: [],
        },
      }
    );

    const args: MutationBlockUserArgs = {
      organizationId: testOrganization!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const blockUserPayload = await blockUserResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser!.id,
    })
      .select(["-password"])
      .lean();

    expect(blockUserPayload).toEqual(testUpdatedTestUser);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["blockedUsers"])
      .lean();

    expect(testUpdatedOrganization?.blockedUsers).toEqual([testUser!._id]);
  });
});
