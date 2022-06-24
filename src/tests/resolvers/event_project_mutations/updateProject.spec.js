const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const database = require('../../../db');
const updateProject = require('../../../lib/resolvers/event_project_mutations/updateProject');
const {
  User,
  Organization,
  Event,
  EventProject,
} = require('../../../lib/models');

let testUser1;

let testUser2;

let testOrganization;

let testEvent;

let testEventProject;

const createUser = async () => {
  const email = `${shortid.generate().toLowerCase()}@test.com`;
  const hashedPassword = await bcrypt.hash('password', 12);

  const newUser = new User({
    email,
    password: hashedPassword,
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
    image: null,
  });

  const createdUser = await newUser.save();

  return createdUser;
};

const createOrganization = async (user) => {
  const name = `organization_${shortid.generate().toLowerCase()}`;

  const newOrganization = new Organization({
    name,
    description: 'testOrganizationDescription',
    isPublic: true,
    visibleInSearch: true,
    apiUrl: `https://${name}.org`,
    image: null,
    creator: user,
    admins: [user],
    members: [user],
  });

  const createdOrganization = await newOrganization.save();

  await User.findOneAndUpdate(
    { _id: user.id },
    {
      $set: {
        joinedOrganizations: [
          ...user._doc.joinedOrganizations,
          createdOrganization,
        ],
        createdOrganizations: [
          ...user._doc.createdOrganizations,
          createdOrganization,
        ],
        adminFor: [...user._doc.adminFor, createdOrganization],
      },
    }
  );

  return createdOrganization;
};

const createEvent = async (userId, organizationId) => {
  const newEvent = new Event({
    title: 'testEventTitle',
    description: 'testEventDescription',
    startDate: '26 March, 2122',
    allDay: true,
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: userId,
    registrants: [
      {
        userId: userId,
        user: userId,
      },
    ],
    admins: [userId],
    organization: organizationId,
  });

  const createdEvent = await newEvent.save();

  await User.updateOne(
    { _id: userId },
    {
      $push: {
        eventAdmin: newEvent,
        createdEvents: newEvent,
        registeredEvents: newEvent,
      },
    }
  );

  return createdEvent;
};

const createEventProject = async (user, event) => {
  const newEventProject = new EventProject({
    title: 'testEventProjectTitle',
    description: 'testEventProjectDescription',
    event,
    creator: user,
  });

  const createdEventProject = await newEventProject.save();

  return createdEventProject;
};

// Read this :- https://jestjs.io/docs/api#beforeallfn-timeout
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect(); // connect the database before running any test in this file's scope

  testUser1 = await createUser();

  testUser2 = await createUser();

  testOrganization = await createOrganization(testUser1);

  testEvent = await createEvent(testUser1._id, testOrganization._id);

  testEventProject = await createEventProject(testUser1, testEvent);
});

// Read this :- https://jestjs.io/docs/api#afterallfn-timeout
afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

/* This test uses two users, one organization created by one of those users,
 one event created by that user, one eventProject created by that user. */

describe('updateProject mutation resolver', () => {
  test('if no user is found the provided context.userId, throws NotFoundError', async () => {
    const context = { userId: mongoose.Types.ObjectId() };

    await expect(async () => {
      await updateProject({}, {}, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('if no eventProject is found for the provided args.id, throws NotFoundError', async () => {
    const args = { id: mongoose.Types.ObjectId() };
    const context = { userId: testUser1._id };

    await expect(async () => {
      await updateProject({}, args, context);
    }).rejects.toEqual(Error('EventProject not found'));
  });

  test('if user with id=context.userId is not the creator of eventProject with id=args.id, throws UnauthorizedError', async () => {
    const args = { id: testEventProject.id };
    const context = { userId: testUser2.id };

    await expect(async () => {
      await updateProject({}, args, context);
    }).rejects.toEqual(Error('User not authorized'));
  });

  test('on successful execution, returns the updated eventProject', async () => {
    const data = {
      title: 'newTestEventProjectTitle',
      description: 'newTestEventProjectDescription',
    };
    const args = { id: testEventProject.id, data };
    const context = { userId: testUser1.id };

    const result = await updateProject({}, args, context);

    expect(result).toEqual(
      expect.objectContaining({
        tasks: expect.arrayContaining([]),
        status: 'ACTIVE',
        _id: testEventProject._id,
        title: data.title,
        description: data.description,
        event: testEvent._id,
        creator: testUser1._id,
        createdAt: testEventProject.createdAt,
        __v: testEventProject.__v,
      })
    );
  });
});
