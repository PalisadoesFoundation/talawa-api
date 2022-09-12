import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Interface_Event,
  Event,
} from '../../../lib/models';
import { MutationAdminRemoveEventArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { adminRemoveEvent as adminRemoveEventResolver } from '../../../lib/resolvers/Mutation/adminRemoveEvent';
import {
  EVENT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

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
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testEvent = await Event.create({
    title: 'title',
    description: 'description',
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser._id,
    admins: [testUser._id],
    registrants: [],
    organization: testOrganization._id,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        eventAdmin: testEvent._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> adminRemoveEvent', () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationAdminRemoveEventArgs = {
        eventId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === event.organization
  for event with _id === args.eventId`, async () => {
    try {
      await Event.updateOne(
        {
          _id: testEvent._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      await Event.updateOne(
        {
          _id: testEvent._id,
        },
        {
          $set: {
            organization: testOrganization._id,
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === event.organization for event with _id === args.eventId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationAdminRemoveEventArgs = {
        eventId: testEvent.id,
      };

      const context = {
        userId: testUser.id,
      };

      await adminRemoveEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes event with _id === args.eventId and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $push: {
          admins: testUser._id,
        },
      }
    );

    const args: MutationAdminRemoveEventArgs = {
      eventId: testEvent.id,
    };

    const context = {
      userId: testUser.id,
    };

    const adminRemoveEventPayload = await adminRemoveEventResolver?.(
      {},
      args,
      context
    );

    expect(adminRemoveEventPayload).toEqual(testEvent.toObject());

    const testUpdatedUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['createdEvents', 'eventAdmin', 'registeredEvents'])
      .lean();

    expect(testUpdatedUser).toEqual(
      expect.objectContaining({
        createdEvents: expect.arrayContaining([]),
        eventAdmin: expect.arrayContaining([]),
        registeredEvents: expect.arrayContaining([]),
      })
    );
  });
});
