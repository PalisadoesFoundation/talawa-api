/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import type {
  InterfaceAppUserProfile,
  InterfaceOrganization,
  InterfaceUser,
} from "../../src/models";
import { AppUserProfile, Organization, User } from "../../src/models";

export type TestOrganizationType =
  | (InterfaceOrganization & Document<any, any, InterfaceOrganization>)
  | null;

export type TestUserType =
  | (InterfaceUser & Document<any, any, InterfaceUser>)
  | null;
export type TestAppUserProfileType =
  | (InterfaceAppUserProfile & Document<any, any, InterfaceAppUserProfile>)
  | null;
export const createTestUser = async (): Promise<TestUserType> => {
  let testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    image: null,
  });
  const testUserAppProfile = await AppUserProfile.create({
    userId: testUser._id,
    appLanguageCode: "en",
    pledges: [],
    campaigns: [],
  });
  testUser = (await User.findOneAndUpdate(
    {
      _id: testUser._id,
    },
    {
      appUserProfileId: testUserAppProfile._id,
    },
    {
      new: true,
    },
  )) as InterfaceUser & Document<any, any, InterfaceUser>;

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
        joinedOrganizations: testOrganization._id,
      },
    },
  );
  if (isAdmin) {
    await AppUserProfile.updateOne(
      {
        userId: userID,
      },
      {
        $push: {
          createdOrganizations: testOrganization._id,
          adminFor: testOrganization._id,
        },
      },
    );
  }
  return testOrganization;
};

export const createTestUserAndOrganization = async (
  isMember = true,
  isAdmin = true,
  userRegistrationRequired = false,
): Promise<[TestUserType, TestOrganizationType]> => {
  const testUser = await createTestUser();
  const testOrganization = await createTestOrganizationWithAdmin(
    testUser?._id.toString(),
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
        joinedOrganizations: testOrganization._id,
      },
    },
  );
  await AppUserProfile.updateOne(
    {
      userId: userID,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
      },
    },
  );

  return testOrganization;
};
