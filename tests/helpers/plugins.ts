import {
    createTestUserAndOrganization,
    testOrganizationType,
    testUserType,
} from "./userAndOrg";
import { Plugin, Interface_Plugin } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";


export type testPluginType =
  | (Interface_Plugin & Document<any, any, Interface_Plugin>)
  | null;

export const createTestPlugin = async (): Promise<
  [testUserType, testOrganizationType, testPluginType]
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


