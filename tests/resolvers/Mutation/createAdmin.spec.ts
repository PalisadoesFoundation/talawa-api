import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization } from "../../../src/models";
import type { MutationCreateAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createAdmin as createAdminResolver } from "../../../src/resolvers/Mutation/createAdmin";
import {
  ORGANIZATION_MEMBER_NOT_FOUND_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { cacheOrganizations } from "../../../src/services/OrganizationCache/cacheOrganizations";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization(false);

  testUser = resultsArray[0];
  testOrganization = resultsArray[1];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdmin", () => {
  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userId: "",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws User not found error if user with _id === context.userId does not exist`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization?._id,
        },
        {
          $set: {
            creator: testUser?._id,
          },
        }
      );

      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if user with _id === args.data.userId is not a member
  of organzation with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        ORGANIZATION_MEMBER_NOT_FOUND_ERROR.MESSAGE
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is already an admin
  of organzation with _id === args.data.organizationId`, async () => {
    try {
      const updatedOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization?._id,
        },
        {
          $push: {
            members: testUser?._id,
          },
        },
        {
          new: true,
        }
      );

      if (updatedOrganization !== null) {
        await cacheOrganizations([updatedOrganization]);
      }

      const args: MutationCreateAdminArgs = {
        data: {
          organizationId: testOrganization?.id,
          userId: testUser?.id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`creates the admin and returns admin's user object`, async () => {
    const updatedOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization?._id,
      },
      {
        $set: {
          admins: [],
        },
      },
      {
        new: true,
      }
    );

    if (updatedOrganization !== null) {
      await cacheOrganizations([updatedOrganization]);
    }

    const args: MutationCreateAdminArgs = {
      data: {
        organizationId: testOrganization?.id,
        userId: testUser?.id,
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const createAdminPayload = await createAdminResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["-password"])
      .lean();

    expect(createAdminPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["admins"])
      .lean();

    expect(updatedTestOrganization?.admins).toEqual([testUser?._id]);
  });
});
