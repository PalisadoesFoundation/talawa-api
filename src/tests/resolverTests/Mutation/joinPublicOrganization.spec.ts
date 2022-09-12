import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from '../../../lib/models';
import { MutationJoinPublicOrganizationArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { joinPublicOrganization as joinPublicOrganizationResolver } from '../../../lib/resolvers/Mutation/joinPublicOrganization';
import {
  COMMENT_NOT_FOUND,
  MEMBER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_ALREADY_MEMBER,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
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
    isPublic: false,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
    visibleInSearch: false,
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
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> joinPublicOrganization', () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if organization with _id === args.organizationId is not public`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            isPublic: true,
          },
        }
      );

      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws ConflictError if user with _id === context.userId is already a member
  of organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationJoinPublicOrganizationArgs = {
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await joinPublicOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_MEMBER);
    }
  });

  it(`returns user object with _id === context.userId after joining the organization    `, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          members: [],
        },
      }
    );

    const args: MutationJoinPublicOrganizationArgs = {
      organizationId: testOrganization.id,
    };

    const context = {
      userId: testUser.id,
    };

    const joinPublicOrganizationPayload =
      await joinPublicOrganizationResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['-password'])
      .lean();

    expect(joinPublicOrganizationPayload).toEqual(updatedTestUser);

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(['members'])
      .lean();

    expect(updatedTestOrganization!.members).toEqual([testUser._id]);
  });
});
