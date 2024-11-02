import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { updateActionItem as updateActionItemResolver } from "../../../src/resolvers/Mutation/updateActionItem";
import type { MutationUpdateActionItemArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

import { nanoid } from "nanoid";
import { ActionItem, AppUserProfile, Event } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import type { TestEventType } from "../../helpers/events";
import type {
  TestVolunteerGroupType,
  TestVolunteerType,
} from "../../helpers/volunteers";
import { createTestVolunteerAndGroup } from "../../helpers/volunteers";

let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let testActionItem: TestActionItemType;
let testEvent: TestEventType;
let tVolunteer: TestVolunteerType;
let tVolunteerGroup: TestVolunteerGroupType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  [testUser2] = await createTestUserAndOrganization();
  [testUser, testOrganization, testCategory, testActionItem] =
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

  [, , , tVolunteer, tVolunteerGroup] = await createTestVolunteerAndGroup();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateActionItem", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          assigneeId: tVolunteer?._id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no action item exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          assigneeId: tVolunteer?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: testActionItem?._id,
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "EventVolunteer",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const testActionItem2 = await ActionItem.create({
        title: `title${nanoid().toLowerCase()}`,
        description: `description${nanoid().toLowerCase()}`,
        creator: testUser?._id,
        assigneeType: "EventVolunteerGroup",
        assigneeGroup: new Types.ObjectId().toString(),
        organization: testOrganization?._id,
        assigner: testUser?._id,
        actionItemCategory: testCategory?._id,
        event: testEvent?._id,
      });

      const args: MutationUpdateActionItemArgs = {
        id: testActionItem2?._id.toString() ?? "",
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "EventVolunteerGroup",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.assigneeId`, async () => {
    try {
      const testActionItem2 = await ActionItem.create({
        title: `title${nanoid().toLowerCase()}`,
        description: `description${nanoid().toLowerCase()}`,
        creator: testUser?._id,
        assigneeType: "EventVolunteerGroup",
        assigneeGroup: new Types.ObjectId().toString(),
        organization: testOrganization?._id,
        assigner: testUser?._id,
        actionItemCategory: testCategory?._id,
        event: testEvent?._id,
      });

      const args: MutationUpdateActionItemArgs = {
        id: testActionItem2?._id.toString() ?? "",
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "EventVolunteerGroup",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it(`throws NotFoundError if no user exists when assigneeUser (doesn't exist)`, async () => {
    try {
      const testActionItem2 = await ActionItem.create({
        title: `title${nanoid().toLowerCase()}`,
        description: `description${nanoid().toLowerCase()}`,
        creator: testUser?._id,
        assigneeType: "User",
        assigneeUser: new Types.ObjectId().toString(),
        organization: testOrganization?._id,
        assigner: testUser?._id,
        actionItemCategory: testCategory?._id,
        event: null,
      });

      const args: MutationUpdateActionItemArgs = {
        id: testActionItem2?._id.toString() ?? "",
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "User",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the user is not a superadmin/orgAdmin/eventAdmin`, async () => {
    try {
      const args: MutationUpdateActionItemArgs = {
        id: testActionItem?._id,
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
        },
      };

      const context = {
        userId: testUser2?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotAuthorizedError if the actionItem.event doesn't exist`, async () => {
    try {
      const testActionItem2 = await ActionItem.create({
        title: `title${nanoid().toLowerCase()}`,
        description: `description${nanoid().toLowerCase()}`,
        event: new Types.ObjectId().toString(),
        creator: testUser?._id,
        assigneeType: "EventVolunteer",
        assignee: new Types.ObjectId().toString(),
        organization: testOrganization?._id,
        assigner: testUser?._id,
        actionItemCategory: testCategory?._id,
      });

      const args: MutationUpdateActionItemArgs = {
        id: testActionItem2?._id.toString() ?? "",
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
        },
      };

      const context = {
        userId: testUser2?._id,
      };

      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`updates the action item and sets action item as completed`, async () => {
    const testActionItem2 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteer",
      assignee: tVolunteer?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 2,
      isCompleted: false,
    });

    const testActionItem3 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteer",
      assignee: tVolunteer?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 0,
      isCompleted: false,
    });

    const args: MutationUpdateActionItemArgs = {
      id: testActionItem2?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteer?._id,
        assigneeType: "EventVolunteer",
        isCompleted: true,
      },
    };

    const args2: MutationUpdateActionItemArgs = {
      id: testActionItem3?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteer?._id,
        assigneeType: "EventVolunteer",
        isCompleted: true,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    await updateActionItemResolver?.({}, args, context);
    await updateActionItemResolver?.({}, args2, context);
  });

  it(`updates the action item and sets action item as not completed`, async () => {
    const testActionItem2 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteer",
      assignee: tVolunteer?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 2,
      isCompleted: true,
    });

    const testActionItem3 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteer",
      assignee: tVolunteer?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      isCompleted: true,
    });

    const args: MutationUpdateActionItemArgs = {
      id: testActionItem2?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteer?._id,
        assigneeType: "EventVolunteer",
        isCompleted: false,
      },
    };

    const args2: MutationUpdateActionItemArgs = {
      id: testActionItem3?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteer?._id,
        assigneeType: "EventVolunteer",
        isCompleted: false,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    await updateActionItemResolver?.({}, args, context);
    await updateActionItemResolver?.({}, args2, context);
  });

  it(`updates the action item and sets action item as completed (Volunteer Group)`, async () => {
    const testActionItem2 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteerGroup",
      assigneeGroup: tVolunteerGroup?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 2,
      isCompleted: false,
    });

    const testActionItem3 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteerGroup",
      assigneeGroup: tVolunteerGroup?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 0,
      isCompleted: false,
    });

    const args: MutationUpdateActionItemArgs = {
      id: testActionItem2?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteerGroup?._id,
        assigneeType: "EventVolunteerGroup",
        isCompleted: true,
      },
    };

    const args2: MutationUpdateActionItemArgs = {
      id: testActionItem3?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteerGroup?._id,
        assigneeType: "EventVolunteerGroup",
        isCompleted: true,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    await updateActionItemResolver?.({}, args, context);
    await updateActionItemResolver?.({}, args2, context);
  });

  it(`updates the action item and sets action item as not completed (Volunteer Group)`, async () => {
    const testActionItem2 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteerGroup",
      assigneeGroup: tVolunteerGroup?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      allottedHours: 2,
      isCompleted: true,
    });

    const testActionItem3 = await ActionItem.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      creator: testUser?._id,
      assigneeType: "EventVolunteerGroup",
      assigneeGroup: tVolunteerGroup?._id,
      organization: testOrganization?._id,
      assigner: testUser?._id,
      actionItemCategory: testCategory?._id,
      event: testEvent?._id,
      isCompleted: true,
    });

    const args: MutationUpdateActionItemArgs = {
      id: testActionItem2?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteerGroup?._id,
        assigneeType: "EventVolunteerGroup",
        isCompleted: false,
      },
    };

    const args2: MutationUpdateActionItemArgs = {
      id: testActionItem3?._id.toString() ?? "",
      data: {
        assigneeId: tVolunteerGroup?._id,
        assigneeType: "EventVolunteerGroup",
        isCompleted: false,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    await updateActionItemResolver?.({}, args, context);
    await updateActionItemResolver?.({}, args2, context);
  });

  it(`updates the actionItem when the user is authorized as an eventAdmin`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        event: testEvent?._id,
      },
      {
        new: true,
      },
    );

    const args: MutationUpdateActionItemArgs = {
      data: {
        isCompleted: true,
      },
      id: updatedTestActionItem?._id.toString() ?? "",
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
        actionItemCategory: testCategory?._id,
        isCompleted: true,
      }),
    );
  });

  it(`updates the actionItem isCompleted is undefined (EventVolunteer)`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        event: testEvent?._id,
      },
      {
        new: true,
      },
    );

    const args: MutationUpdateActionItemArgs = {
      data: {
        isCompleted: undefined,
        assigneeId: undefined,
        assigneeType: "EventVolunteer",
      },
      id: updatedTestActionItem?._id.toString() ?? "",
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
        actionItemCategory: testCategory?._id,
        isCompleted: true,
      }),
    );
  });

  it(`updates the actionItem isCompleted is undefined (EventVolunteerGroup)`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        event: testEvent?._id,
      },
      {
        new: true,
      },
    );

    const args: MutationUpdateActionItemArgs = {
      data: {
        isCompleted: undefined,
        assigneeId: undefined,
        assigneeType: "EventVolunteerGroup",
      },
      id: updatedTestActionItem?._id.toString() ?? "",
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
        actionItemCategory: testCategory?._id,
        isCompleted: true,
      }),
    );
  });

  it(`updates the actionItem isCompleted is undefined (User)`, async () => {
    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        event: testEvent?._id,
      },
      {
        new: true,
      },
    );

    const args: MutationUpdateActionItemArgs = {
      data: {
        isCompleted: undefined,
        assigneeId: undefined,
        assigneeType: "User",
      },
      id: updatedTestActionItem?._id.toString() ?? "",
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
        actionItemCategory: testCategory?._id,
        isCompleted: true,
      }),
    );
  });

  it("throws error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser2?._id,
    });
    const args: MutationUpdateActionItemArgs = {
      id: testActionItem?._id,
      data: {
        assigneeId: testUser?._id,
      },
    };
    const context = {
      userId: testUser2?._id,
    };
    try {
      await updateActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
