const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Create Event Mutation without user', async () => {
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
    const isPublic_boolean = Math.random() < 0.5;
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

    // Removed User from Context
    context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await createEvent({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('Create Event Mutation without Organization', async () => {
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

    // Organization not created and random ID present in the args
    args = {
      data: {
        organizationId: mongoose.Types.ObjectId(),
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

    let context = {
      userId: signUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await createEvent({}, args, context);
    }).rejects.toEqual(Error('Organization not found'));
  });

  test('Create Event Mutation with the user not present in the Organization', async () => {
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
    let signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = Math.random() < 0.5;
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

    // SignUp a new User
    nameForNewUser = shortid.generate().toLowerCase();
    email = `${nameForNewUser}@test.com`;
    args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    signUpResponse = await signup({}, args);

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

    context = {
      userId: signUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await createEvent({}, args, context);
    }).rejects.toEqual(Error('Organization not Authorized'));
  });

  test('Create Event Mutation', async () => {
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
    const isPublic_boolean = Math.random() < 0.5;
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

    const event_isPublic_boolean = Math.random() < 0.5;
    const event_isRegisterable_boolean = Math.random() < 0.5;
    const event_recurring_boolean = Math.random() < 0.5;
    const event_allDay_boolean = Math.random() < 0.5;

    args = {
      data: {
        organizationId: createOrgResponse._id,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        isPublic: event_isPublic_boolean,
        isRegisterable: event_isRegisterable_boolean,
        recurring: event_recurring_boolean,
        recurrance: 'YEARLY',
        location: 'Test',
        startDate: '2/2/2020',
        endDate: '2/2/2022',
        allDay: event_allDay_boolean,
        endTime: '2:00 PM',
        startTime: '1:00 PM',
      },
    };

    const response = await createEvent({}, args, context);

    expect(response.status).toEqual('ACTIVE');
    expect(response.title).toEqual('Talawa Conference Test');
    expect(response.description).toEqual(
      'National conference that happens yearly'
    );
    expect(response.isPublic).toEqual(event_isPublic_boolean);
    expect(response.isRegisterable).toEqual(event_isRegisterable_boolean);
    expect(response.recurring).toEqual(event_recurring_boolean);
    expect(response.recurrance).toEqual('YEARLY');
    expect(response.location).toEqual('Test');
    expect(response.startDate).toEqual('2/2/2020');
    expect(response.allDay).toEqual(event_allDay_boolean);
    expect(response.startTime).toEqual('1:00 PM');
    expect(response.endTime).toEqual('2:00 PM');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.organization).toEqual(createOrgResponse._id);
  });
});
