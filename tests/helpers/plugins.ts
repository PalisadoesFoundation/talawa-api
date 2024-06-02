import type { TestOrganizationType, TestUserType } from "./userAndOrg";
import { createTestUserAndOrganization } from "./userAndOrg";
import type { InterfacePlugin } from "../../src/models";
import { Plugin } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";

export type TestPluginType =
  | (InterfacePlugin & Document<unknown, unknown, InterfacePlugin>)
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
