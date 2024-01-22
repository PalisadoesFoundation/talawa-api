import type { InterfaceActionItemCategory } from "../../src/models";
import { ActionItemCategory, Organization } from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";

export type TestActionItemCategoryType = InterfaceActionItemCategory & Document;

export const createTestCategory = async (): Promise<
  [TestUserType, TestOrganizationType, TestActionItemCategoryType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testCategory = await ActionItemCategory.create({
    creatorId: testUser?._id,
    organizationId: testOrganization?._id,
    name: "Default",
  });

  return [testUser, testOrganization, testCategory];
};

export const createTestCategories = async (): Promise<
  [TestUserType, TestOrganizationType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  await ActionItemCategory.create({
    creatorId: testUser?._id,
    organizationId: testOrganization?._id,
    name: "Default",
  });

  await ActionItemCategory.create({
    creatorId: testUser?._id,
    organizationId: testOrganization?._id,
    name: "Default2",
  });

  return [testUser, testOrganization];
};
