import 'dotenv/config';
import { membershipRequests as membershipRequestsResolver } from '../../../lib/resolvers/Organization/membershipRequests';
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

  const testMembershipRequest = await MembershipRequest.create({
    user: testUser._id,
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );

  testOrganization = await Organization.findOneAndUpdate(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        membershipRequests: testMembershipRequest._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Organization -> membershipRequests', () => {
  it(`returns all membershipRequest objects for parent.membershipRequests`, async () => {
    const parent = testOrganization!.toObject();

    const membershipRequestsPayload = await membershipRequestsResolver?.(
      parent,
      {},
      {}
    );

    const membershipRequests = await MembershipRequest.find({
      _id: {
        $in: testOrganization!.membershipRequests,
      },
    }).lean();

    expect(membershipRequestsPayload).toEqual(membershipRequests);
  });
});
