import type { InterfaceOrganization, InterfaceUser } from "../../src/models";
import { Organization, User } from "../../src/models";
import { nanoid } from "nanoid";
import type { Document } from "mongoose";

export type TestOrganizationType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceOrganization & Document<any, any, InterfaceOrganization>) | null;

export type TestUserType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceUser & Document<any, any, InterfaceUser>) | null;

export const createTestUser = async (): Promise<TestUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    image: null,
    appLanguageCode: "en",
  });

  return testUser;
};

export const createTestOrganizationWithAdmin = async (
  userID: string,
  isMember = true,
  isAdmin = true,
  userRegistrationRequired = false,
): Promise<TestOrganizationType> => {
  const testOrganization = await Organization.create({
    name: `orgName${nanoid().toLowerCase()}`,
    description: `orgDesc${nanoid().toLowerCase()}`,
    userRegistrationRequired: userRegistrationRequired ? true : false,
    creatorId: userID,
    admins: isAdmin ? [userID] : [],
    members: isMember ? [userID] : [],
    visibleInSearch: false,
  });

  await User.updateOne(
    {
      _id: userID,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    },
  );

  return testOrganization;
};

export const createTestUserAndOrganization = async (
  isMember = true,
  isAdmin = true,
  userRegistrationRequired = false,
): Promise<[TestUserType, TestOrganizationType]> => {
  const testUser = await createTestUser();
  const testOrganization = await createTestOrganizationWithAdmin(
    testUser?._id,
    isMember,
    isAdmin,
    userRegistrationRequired,
  );
  return [testUser, testOrganization];
};

export const createOrganizationwithVisibility = async (
  userID: string,
  visibleInSearch: boolean,
): Promise<TestOrganizationType> => {
  const testOrganization = await Organization.create({
    name: `orgName${nanoid().toLowerCase()}`,
    description: `orgDesc${nanoid().toLowerCase()}`,
    userRegistrationRequired: false,
    creatorId: userID,
    admins: [userID],
    members: [userID],
    apiUrl: `apiUrl${nanoid()}`,
    visibleInSearch: visibleInSearch,
  });

  await User.updateOne(
    {
      _id: userID,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    },
  );

  return testOrganization;
};
