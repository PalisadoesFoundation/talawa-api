import {
  Interface_Organization,
  Interface_User,
  Organization,
  User,
} from "../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";

export type TestOrganizationType =
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;

export type TestUserType =
  | (Interface_User & Document<any, any, Interface_User>)
  | null;

export const createTestUser = async (): Promise<TestUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    appLanguageCode: "en",
  });

  return testUser;
};

export const createTestOrganizationWithAdmin = async (
  userID: string,
  isMember = true,
  isAdmin = true,
  isPublic = true
): Promise<TestOrganizationType> => {
  const testOrganization = await Organization.create({
    name: `orgName${nanoid().toLowerCase()}`,
    description: `orgDesc${nanoid().toLowerCase()}`,
    isPublic: isPublic ? true : false,
    creator: userID,
    admins: isAdmin ? [userID] : [],
    members: isMember ? [userID] : [],
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
    }
  );

  return testOrganization;
};

export const createTestUserAndOrganization = async (
  isMember = true,
  isAdmin = true,
  isPublic = true
): Promise<[TestUserType, TestOrganizationType]> => {
  const testUser = await createTestUser();
  const testOrganization = await createTestOrganizationWithAdmin(
    testUser!._id,
    isMember,
    isAdmin,
    isPublic
  );
  return [testUser, testOrganization];
};

export const createOrganizationwithVisibility = async (
  userID: string,
  visibleInSearch: boolean
): Promise<TestOrganizationType> => {
  const testOrganization = await Organization.create({
    name: `orgName${nanoid().toLowerCase()}`,
    description: `orgDesc${nanoid().toLowerCase()}`,
    isPublic: true,
    creator: userID,
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
    }
  );

  return testOrganization;
};
