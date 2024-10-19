import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ACTION_ITEM_CATEGORY_IS_DISABLED,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
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

import { ActionItemCategory, AppUserProfile } from "../../../src/models";
import type { TestActionItemCategoryType } from "../../helpers/actionItemCategory";
import { createTestCategory } from "../../helpers/actionItemCategory";
import type { TestEventType } from "../../helpers/events";
import type {
  TestVolunteerGroupType,
  TestVolunteerType,
} from "../../helpers/volunteers";
import { createTestVolunteerAndGroup } from "../../helpers/volunteers";

let randomUser: TestUserType;
let randomUser2: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testCategory: TestActionItemCategoryType;
let testDisabledCategory: TestActionItemCategoryType;
let tEvent: TestEventType;
let tVolunteer: TestVolunteerType;
let tVolunteerGroup: TestVolunteerGroupType;
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

  [, , tEvent, tVolunteer, tVolunteerGroup] =
    await createTestVolunteerAndGroup();
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
          assigneeType: "EventVolunteer",
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

  it(`throws NotFoundError if no volunteer exists with _id === assigneeId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "EventVolunteer",
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no volunteer group exists with _id === assigneeId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: new Types.ObjectId().toString(),
          assigneeType: "EventVolunteerGroup",
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no actionItemCategory exists with _id === args.actionItemCategoryId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
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
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
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

  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
          eventId: new Types.ObjectId().toString(),
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

  it(`throws NotFoundError new assignee is not a member of the organization`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
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
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
          eventId: new Types.ObjectId().toString(),
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      await createActionItemResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if the AppUserProfile`, async () => {
    try {
      const args: MutationCreateActionItemArgs = {
        data: {
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
          eventId: tEvent?._id,
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: randomUser2?._id,
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
          assigneeId: tVolunteer?._id,
          assigneeType: "EventVolunteer",
        },
        actionItemCategoryId: testCategory?._id,
      };

      const context = {
        userId: testUser?._id,
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
        assigneeId: tVolunteer?._id,
        eventId: tEvent?._id.toString() ?? "",
        assigneeType: "EventVolunteer",
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

  it(`creates the actionItem when user is authorized as an orgAdmin`, async () => {
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: tVolunteerGroup?._id,
        eventId: tEvent?._id.toString() ?? "",
        assigneeType: "EventVolunteerGroup",
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
        assigneeId: tVolunteerGroup?._id,
        assigneeType: "EventVolunteerGroup",
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

    expect(createActionItemPayload?.assignee).toBeUndefined();
  });
  it("throws error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: randomUser?._id,
    });
    const args: MutationCreateActionItemArgs = {
      data: {
        assigneeId: randomUser?._id,
        assigneeType: "EventVolunteer",
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
