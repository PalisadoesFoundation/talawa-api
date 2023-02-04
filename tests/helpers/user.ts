import { Interface_User, User } from "../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";

export type testUserType =
  | (Interface_User & Document<any, any, Interface_User>)
  | null;

export const createTestUser = async (): Promise<testUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    appLanguageCode: "en",
  });

  return testUser;
};

export const createTestUserFunc = async (): Promise<testUserType> => {
  const testUser = await createTestUser();
  return testUser;
};
