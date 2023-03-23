import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Interface_Group, Group } from "../../src/models";
import { Document } from "mongoose";

export type TestGroupType =
  | (Interface_Group & Document<any, any, Interface_Group>)
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
