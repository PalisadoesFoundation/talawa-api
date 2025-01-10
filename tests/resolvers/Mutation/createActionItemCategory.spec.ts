import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createActionItemCategory as createActionItemCategoryResolver } from "../../../src/resolvers/Mutation/createActionItemCategory";
import type { MutationCreateActionItemCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

import { AppUserProfile } from "../../../src/models";

let randomUser: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
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
        isDisabled: false,
        organizationId: testOrganization?._id,
        name: "Default",
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        isDisabled: false,
        organizationId: new Types.ObjectId().toString(),
        name: "Default",
      };
      const context = {
        userId: testUser?.id,
      };
      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it(`throws NotAuthorizedError if the user is not a superadmin or the admin of the organization`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        isDisabled: false,
        organizationId: testOrganization?._id,
        name: "Default",
      };
      const context = {
        userId: randomUser?.id,
      };
      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });
  it(`creates the actionItemCategory and returns it as an admin`, async () => {
    const args: MutationCreateActionItemCategoryArgs = {
      isDisabled: false,
      organizationId: testOrganization?._id,
      name: "Default",
    };
    const context = {
      userId: testUser?._id,
    };
    const createCategoryPayload = await createActionItemCategoryResolver?.(
      {},
      args,
      context,
    );
    expect(createCategoryPayload).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "Default",
      }),
    );
  });
  it(`creates the actionItemCategory and returns it as superAdmin`, async () => {
    const superAdminTestUser = await AppUserProfile.findOneAndUpdate(
      {
        userId: randomUser?._id,
      },
      {
        isSuperAdmin: true,
      },
      {
        new: true,
      },
    );
    const args: MutationCreateActionItemCategoryArgs = {
      isDisabled: false,
      organizationId: testOrganization?._id,
      name: "Default2",
    };
    const context = {
      userId: superAdminTestUser?.userId,
    };
    const createCategoryPayload = await createActionItemCategoryResolver?.(
      {},
      args,
      context,
    );
    expect(createCategoryPayload).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "Default2",
      }),
    );
  });
  it(`throws ConflictError when the actionItemCategory with given name already exists for the current organization`, async () => {
    try {
      const args: MutationCreateActionItemCategoryArgs = {
        isDisabled: false,
        organizationId: testOrganization?._id,
        name: "Default2",
      };
      const context = {
        userId: randomUser?._id,
      };
      await createActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.MESSAGE,
      );
    }
  });
});
