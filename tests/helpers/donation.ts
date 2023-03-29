import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";

import { Donation, Interface_Donation } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestDonationType =
  | (Interface_Donation & Document<any, any, Interface_Donation>)
  | null;

export const createTestDonation = async (): Promise<
  [TestUserType, TestOrganizationType, TestDonationType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testDonation = await Donation.create({
    amount: 1,
    nameOfOrg: testOrganization?.name,
    nameOfUser: `${testUser?.firstName} ${testUser?.lastName}`,
    orgId: testOrganization?._id,
    payPalId: `payPalId${nanoid().toLowerCase()}`,
    userId: testUser?._id,
  });

  return [testUser, testOrganization, testDonation];
};
