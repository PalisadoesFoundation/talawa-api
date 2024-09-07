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
    creator: testUser?._id,
    assignee: randomUser?._id,
    assigner: testUser?._id,
    actionItemCategory: testCategory?._id,
    organization: testOrganization?._id,
  });

  return [testUser, testOrganization, testCategory, testActionItem, randomUser];
};

interface InterfaceCreateNewTestAction {
  currUserId: string;
  assignedUserId: string;
  actionItemCategoryId: string;
  organizationId: string;
}

export const createNewTestActionItem = async ({
  currUserId,
  assignedUserId,
  actionItemCategoryId,
  organizationId,
}: InterfaceCreateNewTestAction): Promise<TestActionItemType> => {
  const newTestActionItem = await ActionItem.create({
    creator: currUserId,
    assignee: assignedUserId,
    assigner: currUserId,
    actionItemCategory: actionItemCategoryId,
    organization: organizationId,
  });

  return newTestActionItem;
};

export const createTestActionItems = async (): Promise<
  [TestUserType, TestUserType, TestEventType, TestOrganizationType]
> => {
  const randomUser = await createTestUser();
  const [testUser, testOrganization, testCategory] = await createTestCategory();

  const testCategory2 = await ActionItemCategory.create({
    creatorId: testUser?._id,
    organizationId: testOrganization?._id,
    name: "ActionItemCategory 2",
  });

  const testActionItem1 = await ActionItem.create({
    creator: testUser?._id,
    assignee: randomUser?._id,
    assigner: testUser?._id,
    actionItemCategory: testCategory?._id,
    organization: testOrganization?._id,
    isCompleted: true,
  });

  const testActionItem2 = await ActionItem.create({
    creator: testUser?._id,
    assignee: randomUser?._id,
    assigner: testUser?._id,
    actionItemCategory: testCategory?._id,
    organization: testOrganization?._id,
    isCompleted: false,
  });

  await ActionItem.create({
    creator: testUser?._id,
    assignee: randomUser?._id,
    assigner: testUser?._id,
    actionItemCategory: testCategory2?._id,
    organization: testOrganization?._id,
    isCompleted: true,
  });

  const testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: false,
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
      event: testEvent?._id,
    },
  );

  await ActionItem.updateOne(
    {
      _id: testActionItem2?._id,
    },
    {
      event: testEvent?._id,
    },
  );

  return [testUser, randomUser, testEvent, testOrganization];
};
