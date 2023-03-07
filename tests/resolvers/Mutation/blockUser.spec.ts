import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import { MutationBlockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { blockUser as blockUserResolver } from "../../../src/resolvers/Mutation/blockUser";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  USER_BLOCKING_SELF,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUser,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testUser2: testUserType;
let testOrganization: testOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();

  testUser2 = await createTestUser();

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
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> blockUser", () => {
  afterEach(() => {
    vi.resetModules();
  });

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

  it(`throws member not found error if user with args.userId is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser2!.id,
      };

      const context = {
        userId: testUser!.id,
      };
      const { blockUser: blockUserResolverError } = await import(
        "../../../src/resolvers/Mutation/blockUser"
      );

      await blockUserResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws cannot block self error if  context.userId === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };
      const { blockUser: blockUserResolverError } = await import(
        "../../../src/resolvers/Mutation/blockUser"
      );

      await blockUserResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_BLOCKING_SELF.message);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      await Organization.findByIdAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser2?.id,
          },
        }
      );

      const args: MutationBlockUserArgs = {
        organizationId: testOrganization!.id,
        userId: testUser2!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.message);
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
            blockedUsers: testUser2!._id,
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
        userId: testUser2!.id,
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
    await Organization.findOneAndUpdate(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          blockedUsers: [],
        },
      },
      {
        new: true,
      }
    );

    const args: MutationBlockUserArgs = {
      organizationId: testOrganization!.id,
      userId: testUser2!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const blockUserPayload = await blockUserResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser2!.id,
    })
      .select(["-password"])
      .lean();

    expect(blockUserPayload).toEqual(testUpdatedTestUser);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization!._id,
    })
      .select(["blockedUsers"])
      .lean();

    expect(testUpdatedOrganization?.blockedUsers).toEqual([testUser2!._id]);
  });
});
