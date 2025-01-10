import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { Fund, type InterfaceFund } from "../../src/models";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "./userAndOrg";
export type TestFundType = (InterfaceFund & Document) | null;

export const createTestFund = async (): Promise<
  [TestUserType, TestOrganizationType, TestFundType]
> => {
  const userAndOrg = await createTestUserAndOrganization(true, true);
  const testUser = userAndOrg[0];
  const testOrganization = userAndOrg[1];
  if (testUser && testOrganization) {
    const testFund = await Fund.create({
      organizationId: testOrganization._id,
      name: `name${nanoid().toLowerCase()}`,
      refrenceNumber: `refrenceNumber${nanoid().toLowerCase()}`,
      taxDeductible: true,
      isDefault: true,
      isArchived: false,
      creatorId: testUser._id,
      campaigns: [],
    });
    return [testUser, testOrganization, testFund];
  } else {
    return [testUser, testOrganization, null];
  }
};
