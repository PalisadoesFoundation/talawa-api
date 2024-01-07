import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateCategoryArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ADMIN,
  CATEGORY_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { updateCategory as updateCategoryResolver } from "../../../src/resolvers/Mutation/updateCategory";
import type { TestCategoryType } from "../../helpers/category";
import { createTestCategory } from "../../helpers/category";
import { User } from "../../../src/models";

let randomUser: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestCategoryType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );

  randomUser = await createTestUser();

  [testUser, testOrganization, testCategory] = await createTestCategory();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateCategoryResolver", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateCategoryArgs = {
        id: Types.ObjectId().toString(),
        data: {
          category: "updatedDefault",
          disabled: true,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no category exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateCategoryArgs = {
        id: Types.ObjectId().toString(),
        data: {
          category: "updatedDefault",
          disabled: true,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await updateCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CATEGORY_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin or the admin of the organization`, async () => {
    try {
      const args: MutationUpdateCategoryArgs = {
        id: testCategory?._id,
        data: {
          category: "updatedDefault",
          disabled: true,
        },
      };

      const context = {
        userId: randomUser?.id,
      };

      await updateCategoryResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ADMIN.MESSAGE);
    }
  });

  it(`updates the category and returns it as an admin`, async () => {
    const args: MutationUpdateCategoryArgs = {
      id: testCategory?._id,
      data: {
        category: "updatedDefault",
        disabled: true,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatedCategory = await updateCategoryResolver?.({}, args, context);

    expect(updatedCategory).toEqual(
      expect.objectContaining({
        org: testOrganization?._id,
        category: "updatedDefault",
        disabled: true,
      })
    );
  });

  it(`updates the category and returns it as superadmin`, async () => {
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

    const args: MutationUpdateCategoryArgs = {
      id: testCategory?._id,
      data: {
        category: "updatedDefault",
        disabled: false,
      },
    };

    const context = {
      userId: superAdminTestUser?._id,
    };

    const updatedCategory = await updateCategoryResolver?.({}, args, context);

    expect(updatedCategory).toEqual(
      expect.objectContaining({
        org: testOrganization?._id,
        category: "updatedDefault",
        disabled: false,
      })
    );
  });
});
