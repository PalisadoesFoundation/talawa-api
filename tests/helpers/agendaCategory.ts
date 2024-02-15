import type { InterfaceAgendaCategory } from "../../src/models";
import { AgendaCategoryModel, Organization } from "../../src/models";
import type { Document } from "mongoose";
import { type TestOrganizationType, type TestUserType } from "./userAndOrg";
import { createTestUser } from "./user";

export type TestAgendaCategoryType = InterfaceAgendaCategory & Document;

export const createTestAgendaCategory = async (): Promise<
  [TestUserType, TestUserType, TestOrganizationType, TestAgendaCategoryType]
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

  return [testUser, testAdminUser, testOrganization, testCategory];
};

export const createTestAgendaCategories = async (): Promise<
  [TestAgendaCategoryType, TestAgendaCategoryType]
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
  const testCat1: TestAgendaCategoryType = await AgendaCategoryModel.create({
    name: "Test Categ",
    description: "Test Desc",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const testCat2: TestAgendaCategoryType = await AgendaCategoryModel.create({
    name: "Test Categ1",
    description: "Test Desc1",
    organization: testOrganization?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  return [testCat1, testCat2];
};
