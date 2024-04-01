import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { MutationUpdateActionItemCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { ActionItemCategory, AppUserProfile } from "../../../src/models";
import { updateActionItemCategory as updateActionItemCategoryResolver } from "../../../src/resolvers/Mutation/updateActionItemCategory";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";

let randomUser: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  randomUser = await createTestUser();

  [testUser, testOrganization, testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateActionItemCategoryResolver", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          name: "updatedDefault",
          isDisabled: true,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no actionItemCategory exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          name: "updatedDefault",
          isDisabled: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin or the admin of the organization`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: testCategory?._id,
        data: {
          name: "updatedDefault",
          isDisabled: true,
        },
      };

      const context = {
        userId: randomUser?.id,
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ADMIN.MESSAGE,
      );
    }
  });

  it(`updates the actionItemCategory and returns it as an admin`, async () => {
    const args: MutationUpdateActionItemCategoryArgs = {
      id: testCategory?._id,
      data: {
        name: "updatedDefault",
        isDisabled: true,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatedCategory = await updateActionItemCategoryResolver?.(
      {},
      args,
      context,
    );

    expect(updatedCategory).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "updatedDefault",
        isDisabled: true,
      }),
    );
  });

  it(`updates the actionItemCategory and returns it as superadmin`, async () => {
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

    const args: MutationUpdateActionItemCategoryArgs = {
      id: testCategory?._id,
      data: {
        name: "updatedDefault2",
        isDisabled: false,
      },
    };

    const context = {
      userId: superAdminTestUser?.userId,
    };

    const updatedCategory = await updateActionItemCategoryResolver?.(
      {},
      args,
      context,
    );

    expect(updatedCategory).toEqual(
      expect.objectContaining({
        organizationId: testOrganization?._id,
        name: "updatedDefault2",
        isDisabled: false,
      }),
    );
  });

  it(`throws ConflictError if an action item category already exists with the provided name`, async () => {
    const newCategory = await ActionItemCategory.create({
      name: "newCategory",
      organizationId: testOrganization?._id,
      isDisabled: false,
      creatorId: testUser?._id,
    });

    await newCategory.save();

    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: testCategory?._id,
        data: {
          name: "newCategory",
          isDisabled: false,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.MESSAGE,
      );
    }
  });
});
