import type { InterfaceAgendaItem } from "../../src/models";
import {
  AgendaItemModel,
  AgendaCategoryModel,
  Organization,
} from "../../src/models";
import type { Document } from "mongoose";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUser } from "./user";
import { Types } from "mongoose";

export type TestAgendaItemType = InterfaceAgendaItem & Document;

export const createTestAgendaItem = async (): Promise<
  [TestUserType, TestUserType, TestOrganizationType, TestAgendaItemType]
> => {
  const testUser: TestUserType = await createTestUser();
  const testAdminUser: TestUserType = await createTestUser();

  const testOrganization: TestOrganizationType = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testAdminUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testAdminUser?._id,
  });

  const testAgendaItem = await AgendaItemModel.create({
    title: "Test Agenda Item",
    description: "Description for the test agenda item",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // Ending time after 1 hour
    location: "Test Location",
    categoryId: new Types.ObjectId().toString(), // A random ID that does not exist in the database
    creator: testUser?._id,
    organization: testOrganization?._id,
    creatorId: testUser?._id,
  });

  return [testUser, testAdminUser, testOrganization, testAgendaItem];
};

export const createTestAgendaItems = async (): Promise<
  [TestAgendaItemType, TestAgendaItemType]
> => {
  const testUser: TestUserType = await createTestUser();
  const testAdminUser: TestUserType = await createTestUser();

  const testOrganization: TestOrganizationType = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testAdminUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testAdminUser?._id,
  });
  const testCategory = await AgendaCategoryModel.create({
    name: "Test Categ",
    description: "Test Desc",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const testAgendaItem1 = await AgendaItemModel.create({
    title: "Test Agenda Item 1",
    description: "Description for the first test agenda item",
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000),
    location: "Test Location 1",
    categoryId: testCategory?._id,
    creator: testUser?._id,
    organization: testOrganization?._id,
    creatorId: testUser?._id,
  });

  const testAgendaItem2 = await AgendaItemModel.create({
    title: "Test Agenda Item 2",
    description: "Description for the second test agenda item",
    startTime: new Date(),
    endTime: new Date(Date.now() + 7200000),
    location: "Test Location 2",
    categoryId: testCategory?._id,
    creator: testAdminUser?._id,
    organization: testOrganization?._id,
    creatorId: testAdminUser?._id,
  });

  return [testAgendaItem1, testAgendaItem2];
};
