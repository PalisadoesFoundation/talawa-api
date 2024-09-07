import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { removeActionItem as removeActionItemResolver } from "../../../src/resolvers/Mutation/removeActionItem";
import type { MutationRemoveActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

import { nanoid } from "nanoid";
import { ActionItem, AppUserProfile, Event } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import {
  createNewTestActionItem,
  createTestActionItem,
} from "../../helpers/actionItem";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import type { TestEventType } from "../../helpers/events";

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
    recurring: false,
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

describe("resolvers -> Mutation -> removeActionItem", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveActionItemArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no action item exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveActionItemArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE,
      );
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
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
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
      context,
    );

    // console.log(removedActionItemPayload);
    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignee: assignedTestUser?._id,
      }),
    );
  });

  it(`removes the action item and returns it as superadmin`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      actionItemCategoryId: testCategory?._id,
      organizationId: testOrganization?._id,
    });

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

    const args: MutationRemoveActionItemArgs = {
      id: newTestActionItem?._id,
    };

    const context = {
      userId: superAdminTestUser?.userId,
    };

    const removedActionItemPayload = await removeActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignee: randomUser?._id,
      }),
    );
  });

  it(`throws NotFoundError if no event exists to which the action item is associated`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      actionItemCategoryId: testCategory?._id,
      organizationId: testOrganization?._id,
    });

    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: newTestActionItem?._id,
      },
      {
        event: new Types.ObjectId().toString(),
      },
      {
        new: true,
      },
    );

    try {
      const args: MutationRemoveActionItemArgs = {
        id: updatedTestActionItem?._id.toString() ?? "",
      };

      const context = {
        userId: testUser?._id,
      };

      await removeActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`removes the actionItem when the user is authorized as an eventAdmin`, async () => {
    const newTestActionItem = await createNewTestActionItem({
      currUserId: testUser?._id,
      assignedUserId: randomUser?._id,
      actionItemCategoryId: testCategory?._id,
      organizationId: testOrganization?._id,
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
      },
    );

    const args: MutationRemoveActionItemArgs = {
      id: updatedTestActionItem?._id.toString() ?? "",
    };

    const context = {
      userId: testUser2?._id,
    };

    const removedActionItemPayload = await removeActionItemResolver?.(
      {},
      args,
      context,
    );

    expect(removedActionItemPayload).toEqual(
      expect.objectContaining({
        assignee: randomUser?._id,
      }),
    );
  });

  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationRemoveActionItemArgs = {
      id: testActionItem?._id,
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      await removeActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
