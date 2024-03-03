import type { InterfaceUser } from "../../src/models";
import { User } from "../../src/models";
import { nanoid } from "nanoid";
import type { Document } from "mongoose";

export type TestUserType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceUser & Document<any, any, InterfaceUser>) | null;

export const createTestUser = async (): Promise<TestUserType> => {
  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    appLanguageCode: "en",
    userType: "ADMIN",
  });

  return testUser;
};

export const createTestUserFunc = async (): Promise<TestUserType> => {
  const testUser = await createTestUser();
  return testUser;
};
