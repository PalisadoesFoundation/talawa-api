import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfaceDonation } from "../../src/models";
import { Donation } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { createTestUser } from "./user";

export type TestDonationType =
  | (InterfaceDonation & Document<unknown, unknown, InterfaceDonation>)
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

export const createTestDonationsForOrganization = async (
  organization: TestOrganizationType,
): Promise<TestDonationType[]> => {
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
