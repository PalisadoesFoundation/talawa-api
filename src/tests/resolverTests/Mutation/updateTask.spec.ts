import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Event,
  Task,
  Interface_Task,
} from '../../../lib/models';
import { MutationUpdateTaskArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { updateTask as updateTaskResolver } from '../../../lib/resolvers/Mutation/updateTask';
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testTasks: (Interface_Task & Document<any, any, Interface_Task>)[];

beforeAll(async () => {
  await connect();

  testUser = await User.create({
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

  const testEvent = await Event.create({
    creator: testUser._id,
    registrants: [{ userId: testUser._id, user: testUser._id }],
    admins: [testUser._id],
    organization: testOrganization._id,
    isRegisterable: true,
    isPublic: true,
    title: 'title',
    description: 'description',
    allDay: true,
    startDate: new Date().toString(),
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
        eventAdmin: [testEvent._id],
      },
    }
  );

  testTasks = await Task.insertMany([
    {
      title: 'title',
      event: testEvent._id,
      creator: testUser._id,
    },
    {
      title: 'title',
      event: testEvent._id,
      creator: Types.ObjectId().toString(),
    },
  ]);

  await Event.updateOne(
    {
      _id: testEvent._id,
    },
    {
      $push: {
        tasks: [testTasks[0]._id, testTasks[1]._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> updateTask', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: '',
        data: {},
      };

      const context = { userId: Types.ObjectId().toString() };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: Types.ObjectId().toString(),
        data: {},
      };

      const context = { userId: testUser._id };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual('Task not found');
    }
  });

  it(`throws NotAuthorizedError if post.creator !== context.userId post with _id === args.id, `, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: testTasks[1]._id,
        data: {},
      };

      const context = {
        userId: testUser._id,
      };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`updates the task with _id === args.id and returns it`, async () => {
    const args: MutationUpdateTaskArgs = {
      id: testTasks[0]._id,
      data: {
        title: 'newTitle',
        deadline: Date.now().toString(),
        description: 'newDescription',
      },
    };

    const context = { userId: testUser._id };

    const updateTaskPayload = await updateTaskResolver?.({}, args, context);

    const updatedTestTask = await Task.findOne({
      _id: testTasks[0]._id,
    }).lean();

    expect(updateTaskPayload).toEqual(updatedTestTask);
  });
});
