import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfaceGroup } from "../../src/models";
import { Group } from "../../src/models";
import type { Document } from "mongoose";

export type TestGroupType =
  | (InterfaceGroup & Document<unknown, unknown, InterfaceGroup>)
  | null;

export const createTestGroup = async (): Promise<
  [TestUserType, TestOrganizationType, TestGroupType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testGroup = await Group.create({
    title: "title",
    organization: testOrganization?._id,
    admins: [testUser?._id],
  });
  return [testUser, testOrganization, testGroup];
};
