import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestEventType,
  TestEventVolunteerGroupType,
  TestEventVolunteerType,
} from "../../helpers/events";
import type { TestUserType } from "../../helpers/user";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceActionItem } from "../../../src/models";
import { ActionItemCategory } from "../../../src/models";
import {
  ACTION_ITEM_CATEGORY_IS_DISABLED,
  ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR,
  EVENT_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { requestContext } from "../../../src/libraries";
import { createActionItem } from "../../../src/resolvers/Mutation/createActionItem";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestActionItemType } from "../../helpers/actionItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testActionItem1: TestActionItemType;
let testEventVolunteer1: TestEventVolunteerType;
let testEventVolunteerGroup: TestEventVolunteerGroupType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  const [
    organization,
    event,
    user1,
    ,
    volunteer1,
    ,
    volunteerGroup,
    actionItem1,
  ] = await createVolunteerAndActions();

  testOrganization = organization;
  testEvent = event;
  testUser1 = user1;
  testEventVolunteer1 = volunteer1;
  testEventVolunteerGroup = volunteerGroup;
  testActionItem1 = actionItem1;
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createActionItem", () => {
  it(`throws EventVolunteer Not Found`, async () => {
    try {
      (await createActionItem?.(
        {},
        {
          data: {
            assigneeId: testEvent?._id,
            assigneeType: "EventVolunteer",
          },
          actionItemCategoryId: testEventVolunteer1?._id,
        },
        { userId: testUser1?._id.toString() },
      )) as unknown as InterfaceActionItem;
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws EventVolunteerGroup Not Found`, async () => {
    try {
      (await createActionItem?.(
        {},
        {
          data: {
            assigneeId: testEvent?._id,
            assigneeType: "EventVolunteerGroup",
          },
          actionItemCategoryId: testEventVolunteer1?._id,
        },
        { userId: testUser1?._id.toString() },
      )) as unknown as InterfaceActionItem;
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws ActionItemCategory Not Found`, async () => {
    try {
      (await createActionItem?.(
        {},
        {
          data: {
            assigneeId: testEventVolunteer1?._id,
            assigneeType: "EventVolunteer",
          },
          actionItemCategoryId: testEventVolunteer1?._id,
        },
        { userId: testUser1?._id.toString() },
      )) as unknown as InterfaceActionItem;
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws ActionItemCategory is Disabled`, async () => {
    const disabledCategory = await ActionItemCategory.create({
      creatorId: testUser1?._id,
      organizationId: testOrganization?._id,
      name: "Disabled Category",
      isDisabled: true,
    });
    try {
      (await createActionItem?.(
        {},
        {
          data: {
            assigneeId: testEventVolunteer1?._id,
            assigneeType: "EventVolunteer",
          },
          actionItemCategoryId: disabledCategory?._id.toString(),
        },
        { userId: testUser1?._id.toString() },
      )) as unknown as InterfaceActionItem;
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        ACTION_ITEM_CATEGORY_IS_DISABLED.MESSAGE,
      );
    }
  });

  it(`throws Event Not Found`, async () => {
    try {
      (await createActionItem?.(
        {},
        {
          data: {
            assigneeId: testEventVolunteer1?._id,
            assigneeType: "EventVolunteer",
            eventId: testUser1?._id.toString(),
          },
          actionItemCategoryId: testActionItem1.actionItemCategory.toString(),
        },
        { userId: testUser1?._id.toString() },
      )) as unknown as InterfaceActionItem;
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`Create Action Item (EventVolunteer) `, async () => {
    const createdItem = (await createActionItem?.(
      {},
      {
        data: {
          assigneeId: testEventVolunteer1?._id,
          assigneeType: "EventVolunteer",
          eventId: testEvent?._id.toString(),
        },
        actionItemCategoryId: testActionItem1.actionItemCategory.toString(),
      },
      { userId: testUser1?._id.toString() },
    )) as unknown as InterfaceActionItem;

    expect(createdItem).toBeDefined();
    expect(createdItem.creator).toEqual(testUser1?._id);
  });

  it(`Create Action Item (EventVolunteerGroup) `, async () => {
    const createdItem = (await createActionItem?.(
      {},
      {
        data: {
          assigneeId: testEventVolunteerGroup?._id,
          assigneeType: "EventVolunteerGroup",
          eventId: testEvent?._id.toString(),
        },
        actionItemCategoryId: testActionItem1.actionItemCategory.toString(),
      },
      { userId: testUser1?._id.toString() },
    )) as unknown as InterfaceActionItem;

    expect(createdItem).toBeDefined();
    expect(createdItem.creator).toEqual(testUser1?._id);
  });

  it(`Create Action Item (User) `, async () => {
    const createdItem = (await createActionItem?.(
      {},
      {
        data: {
          assigneeId: testUser1?._id.toString() as string,
          assigneeType: "User",
        },
        actionItemCategoryId: testActionItem1.actionItemCategory.toString(),
      },
      { userId: testUser1?._id.toString() },
    )) as unknown as InterfaceActionItem;

    expect(createdItem).toBeDefined();
    expect(createdItem.creator).toEqual(testUser1?._id);
  });
});
