import type { InterfaceCommunity } from "../../src/models";
import { Community } from "../../src/models";
import { nanoid } from "nanoid";
import type { Document } from "mongoose";

export type TestCommunityType =
  | (InterfaceCommunity & Document<any, any, InterfaceCommunity>)
  | null;

export const createTestCommunity = async (): Promise<TestCommunityType> => {
  const testCommunity = await Community.create({
    name: `Test Community ${nanoid()}`,
    image: "test-image.jpg",
    description: "Test community description",
    websiteLink: "https://testcommunity.com",
    socialMediaUrls: {
      facebook: "https://facebook.com/testcommunity",
      twitter: "https://twitter.com/testcommunity",
      linkedIn: "https://linkedin.com/testcommunity",
      gitHub: "https://github.com/testcommunity",
      youTube: "https://youtube.com/testcommunity",
      slack: "https://slack.com/testcommunity",
      reddit: "https://reddit.com/testcommunity",
    },
    organizations: [],
    timeout: 30,
  });

  return testCommunity;
};

export const createTestCommunityFunc = async (): Promise<TestCommunityType> => {
  const testCommunity = await createTestCommunity();
  return testCommunity;
};
