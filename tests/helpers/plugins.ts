import {
  createTestUserAndOrganization,
  TestOrganizationType,
  TestUserType,
} from "./userAndOrg";
import { Plugin, InterfacePlugin } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestPluginType =
  | (InterfacePlugin & Document<any, any, InterfacePlugin>)
  | null;

export const createTestPlugin = async (): Promise<
  [TestUserType, TestOrganizationType, TestPluginType]
> => {
  const resultsArray = await createTestUserAndOrganization();
  const testUser = resultsArray[0];
  const testOrganization = resultsArray[1];

  const testPlugin = await Plugin.create({
    pluginName: `pluginName${nanoid().toLowerCase()}`,
    pluginCreatedBy: `${testUser?.firstName} ${testUser?.lastName}`,
    pluginDesc: `pluginDesc${nanoid().toLowerCase()}`,
    pluginInstallStatus: true,
    installedOrgs: [testOrganization?._id],
  });
  return [testUser, testOrganization, testPlugin];
};
