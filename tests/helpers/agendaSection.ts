import type { InterfaceAgendaSection } from "../../src/models";
import {
  AgendaSectionModel,
  AgendaItemModel,
  Organization,
  AgendaCategoryModel,
} from "../../src/models";
import type { Document } from "mongoose";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUser } from "./user";
import type { TestAgendaItemType } from "./agendaItem";

export type TestAgendaSectionType = InterfaceAgendaSection & Document;

export const createTestAgendaSection = async (): Promise<
  [TestUserType, TestUserType, TestOrganizationType, TestAgendaSectionType]
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

  const [testAgendaItem1, testAgendaItem2] = await createTestAgendaItems(
    testUser,
    testAdminUser,
    testOrganization,
  );

  const testAgendaSection = await AgendaSectionModel.create({
    relatedEvent: "65915090c06a8200409b77d6",
    description: "Test Agenda Section Description",
    items: [testAgendaItem1, testAgendaItem2],
    sequence: 1,
    createdAt: new Date(),
    createdBy: testUser,
  });

  return [testUser, testAdminUser, testOrganization, testAgendaSection];
};

export const createTestAgendaSections = async (): Promise<
  [TestAgendaSectionType, TestAgendaSectionType]
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

  const [testAgendaItem1, testAgendaItem2] = await createTestAgendaItems(
    testUser,
    testAdminUser,
    testOrganization,
  );

  const testAgendaSection1 = await AgendaSectionModel.create({
    relatedEvent: "65915090c06a8200409b77d6",
    description: "Test Agenda Section 1 Description",
    items: [testAgendaItem1],
    sequence: 1, // Example sequence number
    createdAt: new Date(),
    // createdBy: testUser,
  });

  const testAgendaSection2 = await AgendaSectionModel.create({
    relatedEvent: "65915090c06a8200409b77d6",
    description: "Test Agenda Section 2 Description",
    items: [testAgendaItem2],
    sequence: 2, // Example sequence number
    // createdAt: new Date(),
    createdBy: testAdminUser,
  });

  return [testAgendaSection1, testAgendaSection2];
};

const createTestAgendaItems = async (
  testUser: TestUserType,
  testAdminUser: TestUserType,
  testOrganization: TestOrganizationType,
): Promise<[TestAgendaItemType, TestAgendaItemType]> => {
  const testCategory = await AgendaCategoryModel.create({
    name: "Test Category",
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
