import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { createActionItem as createActionItemResolver } from "../../../src/resolvers/Mutation/createActionItem";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
  ACTION_ITEM_CATEGORY_IS_DISABLED,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";
import type { TestEventType } from "../../helpers/events";
import { ActionItemCategory, Event, User } from "../../../src/models";
import { nanoid } from "nanoid";

let randomUser: TestUserType;
let randomUser2: TestUserType;
let superAdminTestUser: TestUserType;
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

  superAdminTestUser = await User.findOneAndUpdate(
    {
      _id: randomUser2?._id,
    },
    {
      userType: "SUPERADMIN",
    },
    {
      new: true,
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
        userId: Types.ObjectId().toString(),
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no actionItemCategory exists with _id === args.actionItemCategoryId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: randomUser?._id,
        },
        actionItemCategoryId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
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
    } catch (error: any) {
      expect(error.message).toEqual(ACTION_ITEM_CATEGORY_IS_DISABLED.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: Types.ObjectId().toString(),
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
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
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE);
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
          eventId: Types.ObjectId().toString(),
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: randomUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
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
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`creates the actionItem when user is authorized as an eventAdmin`, async () => {
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
        eventId: testEvent?._id,
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
        actionItemCategoryId: testCategory?._id,
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
        actionItemCategoryId: testCategory?._id,
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
      userId: superAdminTestUser?._id,
    };

    const createActionItemPayload = await createActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(createActionItemPayload).toEqual(
      expect.objectContaining({
        actionItemCategoryId: testCategory?._id,
      }),
    );
  });
});
