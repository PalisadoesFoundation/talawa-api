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
import { MutationRemoveEventArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { removeEvent as removeEventResolver } from '../../../lib/resolvers/Mutation/removeEvent';
import {
  EVENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testEvent: (Interface_Event & Document<any, any, Interface_Event>) | null;

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

describe('resolvers -> Mutation -> removeEvent', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveEventArgs = {
        id: '',
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is neither an
  admin of organization with _id === event.organization for event with _id === args.id
  or an admin for event with _id === args.id`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser._id,
        },
        {
          $set: {
            adminFor: [],
          },
        }
      );

      await Event.updateOne(
        {
          _id: testEvent!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveEventArgs = {
        id: testEvent!.id,
      };

      const context = {
        userId: testUser.id,
      };

      await removeEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes event with _id === args.id and returns it`, async () => {
    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $push: {
          adminFor: testOrganization._id,
        },
      }
    );

    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $push: {
          admins: testUser._id,
        },
      }
    );

    const args: MutationRemoveEventArgs = {
      id: testEvent!.id,
    };

    const context = {
      userId: testUser.id,
    };

    const removeEventPayload = await removeEventResolver?.({}, args, context);

    expect(removeEventPayload).toEqual(testEvent!.toObject());

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['createdEvents', 'eventAdmin'])
      .lean();

    expect(updatedTestUser!.createdEvents).toEqual([]);
    expect(updatedTestUser!.eventAdmin).toEqual([]);

    const updatedTestEvent = await Event.findOne({
      _id: testEvent!._id,
    })
      .select(['status'])
      .lean();

    expect(updatedTestEvent!.status).toEqual('DELETED');
  });
});
