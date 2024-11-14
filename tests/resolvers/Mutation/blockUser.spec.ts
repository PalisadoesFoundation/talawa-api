import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization, User } from "../../../src/models";
import type { MutationBlockUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_BLOCKING_SELF,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { blockUser as blockUserResolver } from "../../../src/resolvers/Mutation/blockUser";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUser();

  testUser2 = await createTestUser();

  testOrganization = await Organization.create({
    name: `name${nanoid().toLowerCase()}`,
    description: `desc${nanoid().toLowerCase()}`,
    isPublic: true,
    creatorId: testUser?._id,
    members: [testUser?._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $set: {
        joinedOrganizations: [testOrganization._id],
      },
    },
  );
  await AppUserProfile.updateOne(
    {
      userId: testUser?._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
      },
    },
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> blockUser", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: new Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: testUser?.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization?.id,
        userId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws member not found error if user with args.userId is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      };

      const context = {
        userId: testUser?.id,
      };
      const { blockUser: blockUserResolverError } = await import(
        "../../../src/resolvers/Mutation/blockUser"
      );

      await blockUserResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(MEMBER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws cannot block self error if  context.userId === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };
      const { blockUser: blockUserResolverError } = await import(
        "../../../src/resolvers/Mutation/blockUser"
      );

      await blockUserResolverError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_BLOCKING_SELF.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      const updatedOrganization = await Organization.findByIdAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser2?.id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationBlockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId is already blocked
  from organization with _id === args.organizationId`, async () => {
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            admins: testUser?._id,
            blockedUsers: testUser2?._id,
          },
        },
        {
          new: true,
        },
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      await AppUserProfile.updateOne(
        {
          userId: testUser?.id,
        },
        {
          $push: {
            adminFor: testOrganization?._id,
          },
        },
      );

      const args: MutationBlockUserArgs = {
        organizationId: testOrganization?.id,
        userId: testUser2?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`blocks the user with _id === args.userId from the organization with
  _id === args.organizationId and returns the blocked user`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          blockedUsers: [],
        },
      },
      {
        new: true,
      },
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationBlockUserArgs = {
      organizationId: testOrganization?.id,
      userId: testUser2?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const blockUserPayload = await blockUserResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser2?.id,
    })
      .select(["-password"])
      .lean();

    expect(blockUserPayload).toEqual(testUpdatedTestUser);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["blockedUsers"])
      .lean();

    expect(testUpdatedOrganization?.blockedUsers).toEqual([testUser2?._id]);
  });
});
