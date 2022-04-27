const mongoose = require('mongoose');
const database = require('../../../db');
const removeProject = require('../../../lib/resolvers/event_project_mutations/removeProject');

const {
  eventProjectTestMutationHelpers,
} = require('./helpers/helperFunctions');

const {
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
  EVENT_PROJECT_NOT_FOUND,
} = require('../../../constants');
let user;
let user2;
let org;
let event;
let eventProject;

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
      if (event) {
        eventProject = await eventProjectTestMutationHelpers.createEventProject(
          user._id,
          event._id
        );
      }
    }
  }
});

afterAll(() => {
  database.disconnect();
});

describe('event_project_mutation removeProject mutation resolver', () => {
  test('when user not exists', async () => {
    const context = { userId: mongoose.Types.ObjectId() };
    await expect(async () => {
      await removeProject({}, {}, context);
    }).rejects.toThrow(USER_NOT_FOUND);
  });
  test('EventProject not exists', async () => {
    const context = { userId: user._id };
    const args = {
      id: mongoose.Types.ObjectId(),
    };
    await expect(async () => {
      await removeProject({}, args, context);
    }).rejects.toThrow(EVENT_PROJECT_NOT_FOUND);
  });
  test('when user is not event creator', async () => {
    const context = { userId: user2._id };
    const args = {
      id: eventProject._id,
    };
    await expect(async () => {
      await removeProject({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });
  test('Event project delete/remove', async () => {
    const context = { userId: `${user._id}` };
    const args = {
      id: eventProject._id,
    };

    const removedProject = await removeProject({}, args, context);
    expect(removedProject).toEqual(
      expect.objectContaining({
        tasks: expect.arrayContaining([]),
        title: eventProject.title,
        description: eventProject.description,
        event: eventProject.event,
        creator: user._id,
        status: eventProject.status,
      })
    );
  });
});
