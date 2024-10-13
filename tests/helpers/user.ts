import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import type { InterfaceUser } from "../../src/models";
import { AppUserProfile, User } from "../../src/models";
import { encryptEmail } from "../../src/utilities/encryption";

export type TestUserType =
  | (InterfaceUser & Document<unknown, unknown, InterfaceUser>)
  | null;

export const createTestUser = async (): Promise<TestUserType> => {
  const testUser = await User.create({
    email: encryptEmail(`email${nanoid().toLowerCase()}@gmail.com`),
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
  });
  const testUserAppProfile = await AppUserProfile.create({
    userId: testUser._id,
    languageCode: "en",
  });
  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      appUserProfileId: testUserAppProfile._id,
    },
  );
  return testUser;
};

export const createTestUserFunc = async (): Promise<TestUserType> => {
  const testUser = await createTestUser();
  return testUser;
};
