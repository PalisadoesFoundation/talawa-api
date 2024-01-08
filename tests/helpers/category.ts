import type { InterfaceCategory } from "../../src/models";
import { Category, Organization } from "../../src/models";
import type { Document } from "mongoose";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";

export type TestCategoryType = InterfaceCategory & Document;

export const createTestCategory = async (): Promise<
  [TestUserType, TestOrganizationType, TestCategoryType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testCategory = await Category.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    orgId: testOrganization?._id,
    category: "Default",
  });

  return [testUser, testOrganization, testCategory];
};

export const createTestCategories = async (): Promise<
  [TestUserType, TestOrganizationType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  const testCategory1 = await Category.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    orgId: testOrganization?._id,
    category: "Default",
  });

  const testCategory2 = await Category.create({
    createdBy: testUser?._id,
    updatedBy: testUser?._id,
    orgId: testOrganization?._id,
    category: "Default2",
  });

  const updatedTestOrganization = await Organization.findOneAndUpdate(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        actionCategories: {
          $each: [testCategory1._id, testCategory2._id],
        },
      },
    },
    {
      new: true,
    }
  );

  return [testUser, updatedTestOrganization];
};
