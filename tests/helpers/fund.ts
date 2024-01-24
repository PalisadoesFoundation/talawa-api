import { nanoid } from "nanoid";
import { Fund, type InterfaceFund } from "../../src/models";
import type { Document } from "mongoose";
import type { TestUserType } from "./user";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
} from "./userAndOrg";

export type TestFundType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceFund & Document<any, any, InterfaceFund>) | null;

export const createTestFund = async (): Promise<
  [TestUserType, TestOrganizationType, TestFundType]
> => {
  const result = await createTestUserAndOrganization();
  const testUser = result[0];
  const testOrg = result[1];
  if (testUser) {
    const testFund = await Fund.create({
      creatorId: testUser._id,
      archived: false,
      taxDeductible: true,
      defaultFund: true,
      organizationId: testOrg?._id,
      name: `TestFundType${nanoid().toLowerCase()}`,
    });

    return [testUser, testOrg, testFund];
  } else {
    return [testUser, testOrg, null];
  }
};
