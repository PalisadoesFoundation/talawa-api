import type { InterfaceCommunity } from "../../src/models";
import { Community } from "../../src/models";
import { nanoid } from "nanoid";
import type { Document } from "mongoose";

export type TestCommunityType =
  | (InterfaceCommunity & Document<unknown, unknown, InterfaceCommunity>)
  | null;

export const createTestCommunity = async (): Promise<TestCommunityType> => {
  const testCommunity = await Community.create({
    name: `Test Community ${nanoid()}`,
    logoUrl: "test-image.jpg",
    description: "Test community description",
    websiteLink: "https://testcommunity.com",
    timeout: 30,
  });

  return testCommunity;
};

export const createTestCommunityFunc = async (): Promise<TestCommunityType> => {
  const testCommunity = await createTestCommunity();
  return testCommunity;
};
