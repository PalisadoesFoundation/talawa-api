import {
  User,
  Organization,
  Interface_User,
  Interface_Organization,
} from "../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";

export type testOrganizationType =
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;

export type testUserType =
  | (Interface_User & Document<any, any, Interface_User>)
  | null;

export const createTestUser = async (): Promise<testUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  return testUser;
};

export const createTestOrganizationWithAdmin = async (
  userID
): Promise<testOrganizationType> => {
  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: userID,
    admins: [userID],
    members: [userID],
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

export const createTestUserAndOrganization = async (): Promise<
  [testUserType, testOrganizationType]
> => {
  const testUser = await createTestUser();
  const testOrganization = await createTestOrganizationWithAdmin(testUser._id);
  return [testUser, testOrganization];
};
