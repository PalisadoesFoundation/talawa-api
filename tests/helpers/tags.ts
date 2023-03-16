import {
  Interface_OrganizationTagUser,
  OrganizationTagUser,
  TagUser,
} from "../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";
import {
  createTestUserAndOrganization,
  testUserType,
  testOrganizationType,
  createTestUser,
} from "./userAndOrg";

export type testUserTagType =
  | (Interface_OrganizationTagUser &
      Document<any, any, Interface_OrganizationTagUser>)
  | null;

export const createRootTagWithOrg = async (): Promise<
  [testUserType, testOrganizationType, testUserTagType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  const testTag = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: null,
    organizationId: testOrganization!._id,
  });

  return [testUser, testOrganization, testTag];
};

export const createRootTagsWithOrg = async (
  numberOfTags = 1
): Promise<[testUserType, testOrganizationType, testUserTagType[]]> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const tags: testUserTagType[] = [];

  for (let i = 0; i < numberOfTags; i++) {
    const testTag = await OrganizationTagUser.create({
      name: `TagTitle${nanoid()}`,
      parentTagId: null,
      organizationId: testOrganization!._id,
    });
    tags.push(testTag);
  }

  return [testUser, testOrganization, tags];
};

export const createTwoLevelTagsWithOrg = async (): Promise<
  [
    testUserType,
    testOrganizationType,
    [testUserTagType, testUserTagType, testUserTagType]
  ]
> => {
  const [testUser, testOrg, testRootTag] = await createRootTagWithOrg();
  const testTag1 = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag!._id,
    organizationId: testOrg!._id,
  });
  const testTag2 = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag!._id,
    organizationId: testOrg!._id,
  });

  return [testUser, testOrg, [testRootTag, testTag1, testTag2]];
};

export const createAndAssignUsersToTag = async (
  tag: testUserTagType,
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

export const createTagsAndAssignToUser = async (
  numberOfTags = 1
): Promise<[testUserType, testOrganizationType, testUserTagType[]]> => {
  const [testUser, testOrg, testTag] = await createRootTagWithOrg();
  await TagUser.create({
    userId: testUser!._id,
    tagId: testTag!._id,
  });

  const tags: testUserTagType[] = [testTag];

  for (let i = 1; i < numberOfTags; i++) {
    const newTag = await OrganizationTagUser.create({
      organizationId: testOrg!._id,
      name: `TagTitle${nanoid()}`,
    });
    tags.push(newTag);

    await TagUser.create({
      tagId: newTag!._id,
      userId: testUser!._id,
    });
  }

  return [testUser, testOrg, tags];
};
