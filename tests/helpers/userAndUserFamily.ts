import { nanoid } from "nanoid";
import type { InterfaceUser } from "../../src/models";
import { AppUserProfile, User } from "../../src/models";
import type { InterfaceUserFamily } from "../../src/models/userFamily";
import { UserFamily } from "../../src/models/userFamily";

import type { Document } from "mongoose";
/* eslint-disable */
export type TestUserFamilyType =
  | (InterfaceUserFamily & Document<any, any, InterfaceUserFamily>)
  | null;

export type TestUserType =
  | (InterfaceUser & Document<any, any, InterfaceUser>)
  | null;
/* eslint-enable */
export const createTestUserFunc = async (): Promise<TestUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    appLanguageCode: "en",
  });
  await AppUserProfile.create({
    userId: testUser._id,
    isSuperAdmin: true,
  });

  return testUser;
};

export const createTestUserFamilyWithAdmin = async (
  userID: string,
  isMember = true,
  isAdmin = true,
): Promise<TestUserFamilyType> => {
  if (userID) {
    const testUserFamily = await UserFamily.create({
      title: `name${nanoid().toLocaleLowerCase()}`,
      users: isMember ? [userID] : [],
      admins: isAdmin ? [userID] : [],
      creator: [userID],
    });

    await User.updateOne(
      {
        _id: userID,
      },
      {
        $push: {
          createdUserFamily: testUserFamily._id,
          joinedUserFamily: testUserFamily._id,
          adminForUserFamily: testUserFamily._id,
        },
      },
    );

    return testUserFamily;
  } else {
    return null;
  }
};

export const createTestUserAndUserFamily = async (
  isMember = true,
  isAdmin = true,
): Promise<[TestUserType, TestUserFamilyType]> => {
  const testUser = await createTestUserFunc();
  const testUserFamily = await createTestUserFamilyWithAdmin(
    testUser?._id,
    isMember,
    isAdmin,
  );

  return [testUser, testUserFamily];
};
