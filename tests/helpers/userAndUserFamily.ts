import { nanoid } from "nanoid";
import type { InterfaceUserFamily } from "../../src/models/userFamily";
import { User } from "../../src/models";
import { UserFamily } from "../../src/models/userFamily";
import type { InterfaceUser } from "../../src/models";

import type { Document } from "mongoose";
import { encryptEmail } from "../../src/utilities/encryptionModule";
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
    email: encryptEmail(`email${nanoid().toLowerCase()}@gmail.com`),
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    appLanguageCode: "en",
    userType: "SUPERADMIN",
  });

  return testUser;
};

export const createTestUserFamilyWithAdmin = async (
  userID: string,
  isMember = true,
  isAdmin = true
): Promise<TestUserFamilyType> => {
  const testUser = await createTestUserFunc();
  if (testUser) {
    const testUserFamily = await UserFamily.create({
      title: `name${nanoid().toLocaleLowerCase()}`,
      users: isMember ? [testUser._id] : [],
      admins: isAdmin ? [testUser._id] : [],
      creator: [testUser._id],
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
      }
    );

    return testUserFamily;
  } else {
    return null;
  }
};

export const createTestUserAndUserFamily = async (
  isMember = true,
  isAdmin = true
): Promise<[TestUserType, TestUserFamilyType]> => {
  const testUser = await createTestUserFunc();
  const testUserFamily = await createTestUserFamilyWithAdmin(
    testUser?._id,
    isMember,
    isAdmin
  );

  return [testUser, testUserFamily];
};
