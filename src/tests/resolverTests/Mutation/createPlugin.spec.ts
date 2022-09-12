import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { MutationCreatePluginArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { createPlugin as createPluginResolver } from '../../../lib/resolvers/Mutation/createPlugin';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> createPlugin', () => {
  it(`creates the plugin and returns it`, async () => {
    const args: MutationCreatePluginArgs = {
      pluginCreatedBy: `pluginCreatedBy`,
      pluginDesc: 'pluginDesc',
      pluginInstallStatus: true,
      pluginName: 'pluginName',
      installedOrgs: [],
    };

    const context = {
      userId: testUser.id,
    };

    const createPluginPayload = await createPluginResolver?.({}, args, context);

    expect(createPluginPayload).toEqual(
      expect.objectContaining({
        pluginCreatedBy: `pluginCreatedBy`,
        pluginDesc: 'pluginDesc',
        pluginInstallStatus: true,
        pluginName: 'pluginName',
        installedOrgs: [],
      })
    );
  });
});
