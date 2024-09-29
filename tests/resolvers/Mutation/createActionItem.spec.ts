import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_CATEGORY_IS_DISABLED,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../src/constants";
import { createActionItem as createActionItemResolver } from "../../../src/resolvers/Mutation/createActionItem";
import type { MutationCreateActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

import { nanoid } from "nanoid";
import {
  ActionItemCategory,
  AppUserProfile,
  Event,
  User,
} from "../../../src/models";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";
import type { TestEventType } from "../../helpers/events";

let randomUser: TestUserType;
let randomUser2: TestUserType;
// let superAdminTestUserAppProfile: TestAppUserProfileType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let testDisabledCategory: TestActionItemCategoryType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  randomUser = await createTestUser();
  randomUser2 = await createTestUser();

  await AppUserProfile.updateOne(
    {
      userId: randomUser2?._id,
    },
    {
      isSuperAdmin: true,
    },
  );

  [testUser, testOrganization, testCategory] = await createTestCategory();

  testDisabledCategory = await ActionItemCategory.create({
    name: "a disabled category",
    organizationId: testOrganization?._id,
    isDisabled: true,
    creatorId: testUser?._id,
  });

  testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: false,
    isPublic: true,
    isRegisterable: true,
    creatorId: randomUser?._id,
    admins: [randomUser?._id],
    organization: testOrganization?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createActionItem", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no actionItemCategory exists with _id === args.actionItemCategoryId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws ConflictError if the actionItemCategory is disabled`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: testDisabledCategory._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_IS_DISABLED.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: new Types.ObjectId().toString(),
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError new assignee is not a member of the organization`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.data.eventId`, async () => {
    await User.findOneAndUpdate(
      {
        _id: randomUser?._id,
      },
      {
        $push: { joinedOrganizations: testOrganization?._id },
      },
    );

    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
          eventId: new Types.ObjectId().toString(),
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: randomUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not authorized for performing the operation`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: randomUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`creates the actionItem when user is authorized as an eventAdmin`, async () => {
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
      actionItemCategoryId: testCategory?._id,
    };

    const context = {
      userId: randomUser?._id,
    };

    const createActionItemPayload = await createActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(createActionItemPayload).toEqual(
      expect.objectContaining({
        actionItemCategory: testCategory?._id,
      }),
    );
  });

  it(`creates the actionItem when user is authorized as an orgAdmin`, async () => {
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
      },
      actionItemCategoryId: testCategory?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const createActionItemPayload = await createActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(createActionItemPayload).toEqual(
      expect.objectContaining({
        actionItemCategory: testCategory?._id,
      }),
    );
  });

  it(`creates the actionItem when user is authorized as superadmin`, async () => {
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
      },
      actionItemCategoryId: testCategory?._id,
    };

    const context = {
      userId: randomUser2?._id,
    };
    // const superAdmin = await AppUserProfile.findOne({
    //   userId: randomUser2?._id,
    // });
    // console.log(superAdmin)

    const createActionItemPayload = await createActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(createActionItemPayload).toEqual(
      expect.objectContaining({
        actionItemCategory: testCategory?._id,
      }),
    );
  });
  it("throws error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: randomUser?._id,
    });
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
      },
      actionItemCategoryId: testCategory?._id,
    };
    const context = {
      userId: randomUser?._id,
    };
    try {
      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
