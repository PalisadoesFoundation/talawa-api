import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "./userAndOrg";

import { Donation, Interface_Donation } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { createTestUser } from "./user";

export type testDonationType =
  | (Interface_Donation & Document<any, any, Interface_Donation>)
  | null;

export const createTestDonation = async (): Promise<
  [testUserType, testOrganizationType, testDonationType]
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

export const createTestDonationsForOrganization = async (
  organization: testOrganizationType
): Promise<Array<testDonationType>> => {
  const testUser1 = await createTestUser();
  const testDonation1 = await Donation.create({
    amount: 1,
    nameOfOrg: organization?.name,
    nameOfUser: `${testUser1?.firstName} ${testUser1?.lastName}`,
    orgId: organization?._id,
    payPalId: `payPalId${nanoid().toLowerCase()}`,
    userId: testUser1?._id,
  });

  const testUser2 = await createTestUser();
  const testDonation2 = await Donation.create({
    amount: 1,
    nameOfOrg: organization?.name,
    nameOfUser: `${testUser2?.firstName} ${testUser2?.lastName}`,
    orgId: organization?._id,
    payPalId: `payPalId${nanoid().toLowerCase()}`,
    userId: testUser2?._id,
  });

  const testUser3 = await createTestUser();
  const testDonation3 = await Donation.create({
    amount: 1,
    nameOfOrg: organization?.name,
    nameOfUser: `${testUser3?.firstName} ${testUser3?.lastName}`,
    orgId: organization?._id,
    payPalId: `payPalId${nanoid().toLowerCase()}`,
    userId: testUser3?._id,
  });

  return [testDonation1, testDonation2, testDonation3];
};
