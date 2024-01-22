import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateActionItemCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createActionItemCategory as createActionItemCategoryResolver } from "../../../src/resolvers/Mutation/createActionItemCategory";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { Organization, User } from "../../../src/models";

let randomUser: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );

  randomUser = await createTestUser();

  [testUser, testOrganization] = await createTestUserAndOrganization();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createCategory", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        organizationId: testOrganization?._id,
        name: "Default",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        organizationId: Types.ObjectId().toString(),
        name: "Default",
      };

      const context = {
        userId: testUser?.id,
      };

      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin or the admin of the organization`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        organizationId: testOrganization?._id,
        name: "Default",
      };

      const context = {
        userId: randomUser?.id,
      };

      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`creates the actionItemCategory and returns it as an admin`, async () => {
    const args: MutationCreateActionItemCategoryArgs = {
      organizationId: testOrganization?._id,
      name: "Default",
    };

    const context = {
      userId: testUser?._id,
    };

    const createCategoryPayload = await createActionItemCategoryResolver?.(
      {},
      args,
      context
    );

    expect(createCategoryPayload).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "Default",
      })
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["actionCategories"])
      .lean();

    expect(updatedTestOrganization).toEqual(
      expect.objectContaining({
        actionCategories: [createCategoryPayload?._id],
      })
    );
  });

  it(`creates the actionItemCategory and returns it as superAdmin`, async () => {
    const superAdminTestUser = await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        userType: "SUPERADMIN",
      },
      {
        new: true,
      }
    );

    const args: MutationCreateActionItemCategoryArgs = {
      organizationId: testOrganization?._id,
      name: "Default",
    };

    const context = {
      userId: superAdminTestUser?._id,
    };

    const createCategoryPayload = await createActionItemCategoryResolver?.(
      {},
      args,
      context
    );

    expect(createCategoryPayload).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "Default",
      })
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization?._id,
    })
      .select(["actionCategories"])
      .lean();

    expect(updatedTestOrganization).toEqual(
      expect.objectContaining({
        actionCategories: expect.arrayContaining([createCategoryPayload?._id]),
      })
    );
  });
});
