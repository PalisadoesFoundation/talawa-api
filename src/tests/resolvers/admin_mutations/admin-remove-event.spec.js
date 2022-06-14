const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');
const adminRemoveEvent = require('../../../lib/resolvers/admin_mutations/admin-remove-event');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Admin Remove Event Mutation without Existing Event', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = true;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        isPublic: true,
        isRegisterable: true,
        recurring: true,
        recurrance: 'YEARLY',
        location: 'Test',
        startDate: '2/2/2020',
        endDate: '2/2/2022',
        allDay: true,
        endTime: '2:00 PM',
        startTime: '1:00 PM',
      },
    };

    args = {
      eventId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemoveEvent({}, args, context);
    }).rejects.toEqual(Error('Event not found'));
  });

  test('Admin Remove Event Mutation without User', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = true;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    let context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        isPublic: true,
        isRegisterable: true,
        recurring: true,
        recurrance: 'YEARLY',
        location: 'Test',
        startDate: '2/2/2020',
        endDate: '2/2/2022',
        allDay: true,
        endTime: '2:00 PM',
        startTime: '1:00 PM',
      },
    };

    const createEventResponse = await createEvent({}, args, context);

    args = {
      eventId: createEventResponse._id,
    };

    context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemoveEvent({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('Admin Remove Event Mutation', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = true;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        isPublic: true,
        isRegisterable: true,
        recurring: true,
        recurrance: 'YEARLY',
        location: 'Test',
        startDate: '2/2/2020',
        endDate: '2/2/2022',
        allDay: true,
        endTime: '2:00 PM',
        startTime: '1:00 PM',
      },
    };

    const createEventResponse = await createEvent({}, args, context);

    args = {
      eventId: createEventResponse._id,
    };

    const adminRemoveEventResponse = await adminRemoveEvent({}, args, context);

    expect(adminRemoveEventResponse.title).toEqual('Talawa Conference Test');
  });
});
