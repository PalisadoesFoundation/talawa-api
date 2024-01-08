import type { InterfaceActionItem } from "../../src/models";
import { ActionItem, Category, Event } from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUser,
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";
import type { TestCategoryType } from "./category";
import { createTestCategory } from "./category";
import { nanoid } from "nanoid";
import type { TestEventType } from "./events";

export type TestActionItemType = InterfaceActionItem & Document;

export const createTestActionItem = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestCategoryType,
    TestActionItemType,
    TestUserType
  ]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const randomUser = await createTestUser();

  const testCategory = await Category.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    orgId: testOrganization?._id,
    category: "Default",
  });

  const testActionItem = await ActionItem.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    assignedTo: randomUser?._id,
    assignedBy: testUser?._id,
    categoryId: testCategory?._id,
  });

  return [testUser, testOrganization, testCategory, testActionItem, randomUser];
};

interface InterfaceCreateNewTestAction {
  currUserId: string;
  assignedUserId: string;
  categoryId: string;
}

export const createNewTestActionItem = async ({
  currUserId,
  assignedUserId,
  categoryId,
}: InterfaceCreateNewTestAction): Promise<TestActionItemType> => {
  const newTestActionItem = await ActionItem.create({
    createdBy: currUserId,
    updatedBy: currUserId,
    assignedTo: assignedUserId,
    assignedBy: currUserId,
    categoryId: categoryId,
  });

  return newTestActionItem;
};

export const createTestActionItems = async (): Promise<
  [TestUserType, TestEventType]
> => {
  const randomUser = await createTestUser();
  const [testUser, testOrganization, testCategory] = await createTestCategory();

  const testActionItem1 = await ActionItem.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    assignedTo: randomUser?._id,
    assignedBy: testUser?._id,
    categoryId: testCategory?._id,
  });

  const testActionItem2 = await ActionItem.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    assignedTo: randomUser?._id,
    assignedBy: testUser?._id,
    categoryId: testCategory?._id,
  });

  const testEvent = await Event.create({
    title: `title${nanoid().toLowerCase()}`,
    description: `description${nanoid().toLowerCase()}`,
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
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
    }
  );

  await ActionItem.updateOne(
    {
      _id: testActionItem2?._id,
    },
    {
      event: testEvent?._id,
    }
  );

  return [testUser, testEvent];
};
