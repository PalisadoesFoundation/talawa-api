import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  ACTION_ITEM_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_MEMBER_FOR_ORGANIZATION,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { updateActionItem as updateActionItemResolver } from "../../../src/resolvers/Mutation/updateActionItem";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { ActionItem, Event, User } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";
import { nanoid } from "nanoid";

let randomUser: TestUserType;
let assignedTestUser: TestUserType;
let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let testActionItem: TestActionItemType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  randomUser = await createTestUser();

  [testUser2] = await createTestUserAndOrganization();
  [testUser, testOrganization, testCategory, testActionItem, assignedTestUser] =
    await createTestActionItem();

  testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creatorId: testUser2?._id,
    admins: [testUser2?._id],
    organization: testOrganization?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateActionItem", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: Types.ObjectId().toString(),
        data: {
          assigneeId: randomUser?._id,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no action item exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: Types.ObjectId().toString(),
        data: {
          assigneeId: randomUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: testActionItem?._id,
        data: {
          assigneeId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if the new asignee is not a member of the organization`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: testActionItem?._id,
        data: {
          assigneeId: randomUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin/orgAdmin/eventAdmin`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: testActionItem?._id,
        data: {
          assigneeId: testUser?._id,
        },
      };

      const context = {
        userId: testUser2?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`updates the action item and returns it as an admin`, async () => {
    const args: MutationUpdateActionItemArgs = {
      id: testActionItem?._id,
      data: {
        assigneeId: assignedTestUser?._id,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updatedActionItemPayload = await updateActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(updatedActionItemPayload).toEqual(
      expect.objectContaining({
        assigneeId: assignedTestUser?._id,
        actionItemCategoryId: testCategory?._id,
      }),
    );
  });

  it(`updates the action item and returns it as superadmin`, async () => {
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

    const args: MutationUpdateActionItemArgs = {
      id: testActionItem?._id,
      data: {
        assigneeId: testUser?._id,
      },
    };

    const context = {
      userId: superAdminTestUser?._id,
    };

    const updatedActionItemPayload = await updateActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(updatedActionItemPayload).toEqual(
      expect.objectContaining({
        assigneeId: testUser?._id,
        actionItemCategoryId: testCategory?._id,
      }),
    );
  });

  it(`throws NotFoundError if no event exists to which the action item is associated`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        eventId: Types.ObjectId().toString(),
      },
      {
        new: true,
      },
    );

    await User.updateOne(
      {
        _id: randomUser?._id,
      },
      {
        $push: { joinedOrganizations: testOrganization?._id },
      },
    );

    try {
      const args: MutationUpdateActionItemArgs = {
        id: updatedTestActionItem?._id,
        data: {
          assigneeId: randomUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`updates the actionItem when the user is authorized as an eventAdmin`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        eventId: testEvent?._id,
      },
      {
        new: true,
      },
    );

    const args: MutationUpdateActionItemArgs = {
      data: {
        assigneeId: testUser?._id,
      },
      id: updatedTestActionItem?._id,
    };

    const context = {
      userId: testUser2?._id,
    };

    const updatedActionItemPayload = await updateActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(updatedActionItemPayload).toEqual(
      expect.objectContaining({
        actionItemCategoryId: testCategory?._id,
        assigneeId: testUser?._id,
      }),
    );
  });
});
