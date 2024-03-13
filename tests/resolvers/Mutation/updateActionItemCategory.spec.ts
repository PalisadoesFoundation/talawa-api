import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateActionItemCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  ACTION_ITEM_CATEGORY_ALREADY_EXISTS,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { updateActionItemCategory as updateActionItemCategoryResolver } from "../../../src/resolvers/Mutation/updateActionItemCategory";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";
import { ActionItemCategory, User } from "../../../src/models";

let randomUser: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let testCategory2: TestActionItemCategoryType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  randomUser = await createTestUser();

  [testUser, testOrganization, testCategory] = await createTestCategory();

  testCategory2 = await ActionItemCategory.create({
    name: "another action item category",
    organizationId: testOrganization?._id,
    creatorId: testUser?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateActionItemCategoryResolver", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: Types.ObjectId().toString(),
        data: {
          name: "updatedDefault",
          isDisabled: true,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no actionItemCategory exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: Types.ObjectId().toString(),
        data: {
          name: "updatedDefault",
          isDisabled: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws ConflictError if an actionItemCategory already exists with name === args.data.name`, async () => {
    try {
      const args: MutationUpdateActionItemCategoryArgs = {
        id: testCategory2._id,
        data: {
          name: "Default",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await updateActionItemCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        ACTION_ITEM_CATEGORY_ALREADY_EXISTS.MESSAGE,
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
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
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
    const superAdminTestUser = await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        userType: "SUPERADMIN",
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
      userId: superAdminTestUser?._id,
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
});
