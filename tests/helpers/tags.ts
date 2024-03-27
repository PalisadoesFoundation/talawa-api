import { nanoid } from "nanoid";
import type { InterfaceOrganizationTagUser } from "../../src/models";
import { OrganizationTagUser, TagUser } from "../../src/models";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUser, createTestUserAndOrganization } from "./userAndOrg";

export type TestUserTagType = InterfaceOrganizationTagUser | null;

export const createRootTagWithOrg = async (): Promise<
  [TestUserType, TestOrganizationType, TestUserTagType]
> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();

  const testTag = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: null,
    organizationId: testOrganization?._id,
    tagColor: `tagColor${nanoid()}`,
  });

  return [testUser, testOrganization, testTag?.toObject()];
};

export const createRootTagsWithOrg = async (
  numberOfTags = 1,
): Promise<[TestUserType, TestOrganizationType, TestUserTagType[]]> => {
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const tags: TestUserTagType[] = [];

  for (let i = 0; i < numberOfTags; i++) {
    const testTag = await OrganizationTagUser.create({
      name: `TagTitle${nanoid()}`,
      parentTagId: null,
      organizationId: testOrganization?._id,
      tagColor: `tagColor${nanoid()}`,
    });
    tags.push(testTag.toObject());
  }

  return [testUser, testOrganization, tags];
};

export const createTwoLevelTagsWithOrg = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    [TestUserTagType, TestUserTagType, TestUserTagType],
  ]
> => {
  const [testUser, testOrg, testRootTag] = await createRootTagWithOrg();
  const testTag1 = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag?._id,
    organizationId: testOrg?._id,
    tagColor: `tagColor${nanoid()}`,
  });
  const testTag2 = await OrganizationTagUser.create({
    name: `TagTitle${nanoid()}`,
    parentTagId: testRootTag?._id,
    organizationId: testOrg?._id,
    tagColor: `tagColor${nanoid()}`,
  });

  return [
    testUser,
    testOrg,
    [testRootTag, testTag1.toObject(), testTag2.toObject()],
  ];
};

export const createAndAssignUsersToTag = async (
  tag: TestUserTagType,
  numberOfUsers = 1,
): Promise<TestUserType[]> => {
  const testUsers: TestUserType[] = [];

  for (let i = 0; i < numberOfUsers; i++) {
    const user = await createTestUser();
    await TagUser.create({
      userId: user?._id,
      tagId: tag?._id,
    });
    testUsers.push(user);
  }

  return testUsers;
};

export const createTagsAndAssignToUser = async (
  numberOfTags = 1,
): Promise<[TestUserType, TestOrganizationType, TestUserTagType[]]> => {
  const [testUser, testOrg, testTag] = await createRootTagWithOrg();
  await TagUser.create({
    userId: testUser?._id,
    tagId: testTag?._id,
  });

  const tags: TestUserTagType[] = [testTag];

  for (let i = 1; i < numberOfTags; i++) {
    const newTag = await OrganizationTagUser.create({
      organizationId: testOrg?._id,
      name: `TagTitle${nanoid()}`,
      tagColor: `tagColor${nanoid()}`,
    });
    tags.push(newTag.toObject());

    await TagUser.create({
      tagId: newTag?._id,
      userId: testUser?._id,
    });
  }

  return [testUser, testOrg, tags];
};
