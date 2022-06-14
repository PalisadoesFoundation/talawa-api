const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const createProject = require('../../../lib/resolvers/event_project_mutations/createProject');

const {
  eventProjectTestMutationHelpers,
} = require('./helpers/helperFunctions');

let user;
let user2;
let org;
let event;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();

  user = await eventProjectTestMutationHelpers.createUser();
  user2 = await eventProjectTestMutationHelpers.createUser();
  if (user) {
    org = await eventProjectTestMutationHelpers.createOrganization(user._id);
    if (org) {
      event = await eventProjectTestMutationHelpers.createEvent(
        user._id,
        org._id
      );
    }
  }
});

afterAll(() => {
  database.disconnect();
});

describe('event_project_mutation createProject mutation resolver', () => {
  test('when user not exists', async () => {
    const context = { userId: mongoose.Types.ObjectId() };
    await expect(async () => {
      await createProject({}, {}, context);
    }).rejects.toThrow('User not found');
  });
  test('when Event not exists', async () => {
    const context = { userId: user._id };
    const args = {
      data: {
        eventId: mongoose.Types.ObjectId(),
      },
    };
    await expect(async () => {
      await createProject({}, args, context);
    }).rejects.toThrow('Event not found');
  });
  test('when user is not event admin', async () => {
    const context = { userId: user2._id };
    const args = {
      data: {
        eventId: event._id,
      },
    };
    await expect(async () => {
      await createProject({}, args, context);
    }).rejects.toThrow('User not Authorized');
  });
  test('Event project creation', async () => {
    const context = { userId: user._id };
    const data = {
      title: `test_event_project_${shortid.generate().toLowerCase()}`,
      description: `testEventProjectDescription_${shortid
        .generate()
        .toLowerCase()}`,
      eventId: event._id,
    };

    const args = {
      data,
    };
    const createdProject = await createProject({}, args, context);
    expect(createdProject).toEqual(
      expect.objectContaining({
        tasks: expect.arrayContaining([]),
        title: data.title,
        description: data.description,
        event: expect.objectContaining({
          _id: data.eventId,
        }),
        creator: expect.objectContaining({
          _id: user._id,
        }),
      })
    );
  });
});
