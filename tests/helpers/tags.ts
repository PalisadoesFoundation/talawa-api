import { Interface_Tag, Tag, TagUser } from "../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";
import {
  createTestUserAndOrganization,
  testUserType,
  testOrganizationType,
  createTestUser,
} from "./userAndOrg";

export type testTagType =
  | (Interface_Tag & Document<any, any, Interface_Tag>)
  | null;

export const createRootTagWithOrg = async (): Promise<
  [testUserType, testOrganizationType, testTagType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  const testTag = await Tag.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: null,
    organizationId: testOrganization!._id,
  });

  return [testUser, testOrganization, testTag];
};

export const createTwoLevelTagsWithOrg = async (): Promise<
  [testUserType, testOrganizationType, [testTagType, testTagType, testTagType]]
> => {
  const [testUser, testOrg, testRootTag] = await createRootTagWithOrg();
  const testTag1 = await Tag.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag?._id,
    organizationId: testOrg!._id,
  });
  const testTag2 = await Tag.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag?._id,
    organizationId: testOrg!._id,
  });

  return [testUser, testOrg, [testRootTag, testTag1, testTag2]];
};

export const createAndAssignUsersToTag = async (
  tag: testTagType,
  numberOfUsers = 1
): Promise<testUserType[]> => {
  const testUsers: testUserType[] = [];

  for (let i = 0; i < numberOfUsers; i++) {
    const user = await createTestUser();
    await TagUser.create({
      userId: user!._id,
      tagId: tag!._id,
    });
    testUsers.push(user);
  }

  return testUsers;
};
