import 'dotenv/config';
import { user as userResolver } from '../../../lib/resolvers/MembershipRequest/user';
import { connect, disconnect } from '../../../db';
import {
  User,
  Organization,
  MembershipRequest,
  Interface_MembershipRequest,
} from '../../../lib/models';
import { Document } from 'mongoose';
import { nanoid } from 'nanoid';

let testMembershipRequest: Interface_MembershipRequest &
  Document<any, any, Interface_MembershipRequest>;

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
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testMembershipRequest = await MembershipRequest.create({
    organization: testOrganization._id,
    user: testUser._id,
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> MembershipRequest -> user', () => {
  it(`returns user object for parent.user`, async () => {
    const parent = testMembershipRequest.toObject();

    const userPayload = await userResolver?.(parent, {}, {});

    const user = await User.findOne({
      _id: testMembershipRequest.user,
    }).lean();

    expect(userPayload).toEqual(user);
  });
});
