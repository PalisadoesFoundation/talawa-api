import 'dotenv/config';
import { groups as groupsResolver } from '../../../lib/resolvers/Query/groups';
import { connect, disconnect } from '../../../db';
import { User, Organization, Group } from '../../../lib/models';
import { nanoid } from 'nanoid';

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  const testOrganization = await Organization.create({
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

  await Group.create({
    title: 'title',
    organization: testOrganization._id,
    admins: [testUser._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Query -> groups', () => {
  it(`returns list of all existing groups`, async () => {
    const groupsPayload = await groupsResolver?.({}, {}, {});

    const groups = await Group.find().lean();

    expect(groupsPayload).toEqual(groups);
  });
});
