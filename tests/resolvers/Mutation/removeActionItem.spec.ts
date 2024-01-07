import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationRemoveActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  ACTION_ITEM_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  EVENT_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { removeActionItem as removeActionItemResolver } from "../../../src/resolvers/Mutation/removeActionItem";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";

import type { TestCategoryType } from "../../helpers/category";
import { ActionItem, Event, User } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import {
  createNewTestActionItem,
  createTestActionItem,
} from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";
import { nanoid } from "nanoid";

let randomUser: TestUserType;
let assignedTestUser: TestUserType;
let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestCategoryType;
let testActionItem: TestActionItemType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
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
    creator: testUser2?._id,
    admins: [testUser2?._id],
    organization: testOrganization?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeActionItem", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveActionItemArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no action item exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveActionItemArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin/orgAdmin/eventAdmin`, async () => {
    try {
      const args: MutationRemoveActionItemArgs = {
        id: testActionItem?._id,
      };

      const context = {
        userId: testUser2?._id,
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`removes the action item and returns it as an admin`, async () => {
    const args: MutationRemoveActionItemArgs = {
      id: testActionItem?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const removedActionItemPayload = await removeActionItemResolver?.(
      {},
      args,
      context
    );

    // console.log(removedActionItemPayload);
    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignedTo: assignedTestUser?._id,
      })
    );
  });

  it(`removes the action item and returns it as superadmin`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      categoryId: testCategory?._id,
    });

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

    const args: MutationRemoveActionItemArgs = {
      id: newTestActionItem?._id,
    };

    const context = {
      userId: superAdminTestUser?._id,
    };

    const removedActionItemPayload = await removeActionItemResolver?.(
      {},
      args,
      context
    );

    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignedTo: randomUser?._id,
      })
    );
  });

  it(`throws NotFoundError if no event exists to which the action item is associated`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      categoryId: testCategory?._id,
    });

    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: newTestActionItem?._id,
      },
      {
        event: Types.ObjectId().toString(),
      },
      {
        new: true,
      }
    );

    try {
      const args: MutationRemoveActionItemArgs = {
        id: updatedTestActionItem?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`removes the actionItem when the user is authorized as an eventAdmin`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      categoryId: testCategory?._id,
    });

    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: newTestActionItem?._id,
      },
      {
        event: testEvent?._id,
      },
      {
        new: true,
      }
    );

    const updatedTestEvent = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
      },
      {
        $push: { actionItems: newTestActionItem?._id },
      },
      {
        new: true,
      }
    )
      .select(["actionItems"])
      .lean();

    expect(updatedTestEvent).toEqual(
      expect.objectContaining({
        actionItems: expect.arrayContaining([updatedTestActionItem?._id]),
      })
    );

    const args: MutationRemoveActionItemArgs = {
      id: updatedTestActionItem?._id,
    };

    const context = {
      userId: testUser2?._id,
    };

    const removedActionItemPayload = await removeActionItemResolver?.(
      {},
      args,
      context
    );

    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignedTo: randomUser?._id,
      })
    );

    const updatedTestEventInfo = await Event.findOne({
      _id: testEvent?._id,
    })
      .select(["actionItems"])
      .lean();

    expect(updatedTestEventInfo).toEqual(
      expect.objectContaining({
        actionItems: expect.not.arrayContaining([updatedTestActionItem?._id]),
      })
    );
  });
});
