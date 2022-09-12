import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User, Organization } from '../../../lib/models';
import { MutationCreateOrganizationArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { createOrganization as createOrganizationResolver } from '../../../lib/resolvers/Mutation/createOrganization';
import { USER_NOT_FOUND } from '../../../constants';
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

describe('resolvers -> Mutation -> createOrganization', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateOrganizationArgs = {
        data: {
          description: 'description',
          isPublic: true,
          name: 'name',
          visibleInSearch: true,
          apiUrl: 'apiUrl',
          location: 'location',
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createOrganizationResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the organization and returns it`, async () => {
    const args: MutationCreateOrganizationArgs = {
      data: {
        description: 'description',
        isPublic: true,
        name: 'name',
        visibleInSearch: true,
        apiUrl: 'apiUrl',
        location: 'location',
      },
    };

    const context = {
      userId: testUser._id,
    };

    const createOrganizationPayload = await createOrganizationResolver?.(
      {},
      args,
      context
    );

    expect(createOrganizationPayload).toEqual(
      expect.objectContaining({
        description: 'description',
        isPublic: true,
        name: 'name',
        visibleInSearch: true,
        apiUrl: 'apiUrl',
        location: 'location',
        creator: testUser._id,
        admins: [testUser._id],
        members: [testUser._id],
      })
    );

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['joinedOrganizations', 'createdOrganizations', 'adminFor'])
      .lean();

    expect(updatedTestUser).toEqual(
      expect.objectContaining({
        joinedOrganizations: [createOrganizationPayload!._id],
        createdOrganizations: [createOrganizationPayload!._id],
        adminFor: [createOrganizationPayload!._id],
      })
    );
  });
});
