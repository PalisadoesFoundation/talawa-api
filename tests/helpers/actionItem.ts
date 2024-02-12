import type { InterfaceActionItem } from "../../src/models";
import { ActionItem, ActionItemCategory, Event } from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";
import type { TestActionItemCategoryType } from "./actionItemCategory";
import { createTestCategory } from "./actionItemCategory";
import { nanoid } from "nanoid";
import type { TestEventType } from "./events";

export type TestActionItemType = InterfaceActionItem & Document;

export const createTestActionItem = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestActionItemCategoryType,
    TestActionItemType,
    TestUserType,
  ]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const randomUser = await createTestUser();

  const testCategory = await ActionItemCategory.create({
    creatorId: testUser?._id,
    organizationId: testOrganization?._id,
    name: "Default",
  });

  const testActionItem = await ActionItem.create({
    creatorId: testUser?._id,
    assigneeId: randomUser?._id,
    assignerId: testUser?._id,
    actionItemCategoryId: testCategory?._id,
  });

  return [testUser, testOrganization, testCategory, testActionItem, randomUser];
};

interface InterfaceCreateNewTestAction {
  currUserId: string;
  assignedUserId: string;
  actionItemCategoryId: string;
}

export const createNewTestActionItem = async ({
  currUserId,
  assignedUserId,
  actionItemCategoryId,
}: InterfaceCreateNewTestAction): Promise<TestActionItemType> => {
  const newTestActionItem = await ActionItem.create({
    creatorId: currUserId,
    assigneeId: assignedUserId,
    assignerId: currUserId,
    actionItemCategoryId: actionItemCategoryId,
  });

  return newTestActionItem;
};

export const createTestActionItems = async (): Promise<
  [TestUserType, TestEventType, TestOrganizationType]
> => {
  const randomUser = await createTestUser();
  const [testUser, testOrganization, testCategory] = await createTestCategory();

  const testActionItem1 = await ActionItem.create({
    creatorId: testUser?._id,
    assigneeId: randomUser?._id,
    assignerId: testUser?._id,
    actionItemCategoryId: testCategory?._id,
  });

  const testActionItem2 = await ActionItem.create({
    creatorId: testUser?._id,
    assigneeId: randomUser?._id,
    assignerId: testUser?._id,
    actionItemCategoryId: testCategory?._id,
  });

  const testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creatorId: testUser?._id,
    admins: [testUser?._id],
    organization: testOrganization?._id,
    actionItems: [testActionItem1?._id, testActionItem2?._id],
  });

  await ActionItem.updateOne(
    {
      _id: testActionItem1?._id,
    },
    {
      eventId: testEvent?._id,
    },
  );

  await ActionItem.updateOne(
    {
      _id: testActionItem2?._id,
    },
    {
      eventId: testEvent?._id,
    },
  );

  return [testUser, testEvent, testOrganization];
};
