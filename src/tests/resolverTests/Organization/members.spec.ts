import 'dotenv/config';
import { members as membersResolver } from '../../../lib/resolvers/Organization/members';
import { connect, disconnect } from '../../../db';
import {
  User,
  Organization,
  MembershipRequest,
  Interface_Organization,
} from '../../../lib/models';
import { Document } from 'mongoose';
import { nanoid } from 'nanoid';

let testOrganization:
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
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
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Organization -> members', () => {
  it(`returns all user objects for parent.members`, async () => {
    const parent = testOrganization!.toObject();

    const membersPayload = await membersResolver?.(parent, {}, {});

    const members = await User.find({
      _id: {
        $in: testOrganization!.members,
      },
    }).lean();

    expect(membersPayload).toEqual(members);
  });
});
