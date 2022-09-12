import 'dotenv/config';
import { Document } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Plugin,
  Interface_Plugin,
  Interface_Organization,
} from '../../../lib/models';
import { MutationUpdatePluginInstalledOrgsArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { updatePluginInstalledOrgs as updatePluginInstalledOrgsResolver } from '../../../lib/resolvers/Mutation/updatePluginInstalledOrgs';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testPlugin: Interface_Plugin & Document<any, any, Interface_Plugin>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  testOrganization = await Organization.create({
    name: 'name',
    description: 'description',
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testPlugin = await Plugin.create({
    pluginName: 'pluginName',
    pluginCreatedBy: `${testUser.firstName} ${testUser.lastName}`,
    pluginDesc: 'pluginDesc',
    pluginInstallStatus: false,
    installedOrgs: [testOrganization._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> updatePluginInstalledOrgs', () => {
  it(`if organization with _id === args.orgId already exists in plugin.installedOrgs
    for plugin with _id === args.id, removes it from plugin.installedOrgs`, async () => {
    const args: MutationUpdatePluginInstalledOrgsArgs = {
      id: testPlugin._id,
      orgId: testOrganization._id,
    };

    const context = {
      userId: testUser._id,
    };

    const updatePluginInstalledOrgsPayload =
      await updatePluginInstalledOrgsResolver?.({}, args, context);

    const testUpdatePluginStatusPayload = await Plugin.findOne({
      _id: testPlugin._id,
    }).lean();

    expect(updatePluginInstalledOrgsPayload).toEqual(
      testUpdatePluginStatusPayload
    );
  });

  it(`if organization with _id === args.orgId doesn't exist in plugin.installedOrgs
  for plugin with _id === args.id, adds it to plugin.installedOrgs`, async () => {
    const args: MutationUpdatePluginInstalledOrgsArgs = {
      id: testPlugin._id,
      orgId: testOrganization._id,
    };

    const context = {
      userId: testUser._id,
    };

    const updatePluginInstalledOrgsPayload =
      await updatePluginInstalledOrgsResolver?.({}, args, context);

    const testUpdatePluginStatusPayload = await Plugin.findOne({
      _id: testPlugin._id,
    }).lean();

    expect(updatePluginInstalledOrgsPayload).toEqual(
      testUpdatePluginStatusPayload
    );
  });
});
