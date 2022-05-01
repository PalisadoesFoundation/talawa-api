const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const registerForEvent = require('../../../lib/resolvers/event_mutations/registerForEvent');
const unregisterForEvent = require('../../../lib/resolvers/event_mutations/unregisterForEvent');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const {
  EVENT_NOT_FOUND,
  USER_NOT_FOUND,
  USER_ALREADY_UNREGISTERED,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Unregister for Event Mutation without user', async () => {
    //Random Id for User
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    const args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await unregisterForEvent({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Unregister Event Mutation without Existing event', async () => {
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

    // Event hasn't been created and random ID present in the args
    args = {
      id: mongoose.Types.ObjectId(),
    };

    let context = {
      userId: signUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await unregisterForEvent({}, args, context);
    }).rejects.toEqual(Error(EVENT_NOT_FOUND));
  });

  test('Unregister Event Mutation without user registered', async () => {
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

    const createEventResponse = await createEvent({}, args, context);

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
    const newUserSignUpResponse = await signup({}, args);

    args = {
      id: createEventResponse._id,
    };

    context = {
      userId: newUserSignUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await unregisterForEvent({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Unregister Event Mutation when user already unregistered', async () => {
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

    const createEventResponse = await createEvent({}, args, context);

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

    const newUserSignUpResponse = await signup({}, args);

    context = {
      userId: newUserSignUpResponse.user._id.toString(),
    };

    args = {
      id: createEventResponse._id,
    };

    // Register for an event before unregistering
    await registerForEvent({}, args, context);

    // Unregister for an event after registering
    await unregisterForEvent({}, args, context);

    // Calling Unregister Mutation again after unregistering an event
    await expect(async () => {
      await unregisterForEvent({}, args, context);
    }).rejects.toEqual(Error(USER_ALREADY_UNREGISTERED));
  });

  test('Unregister Event Mutation', async () => {
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

    const createEventResponse = await createEvent({}, args, context);

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

    const newUserSignUpResponse = await signup({}, args);

    context = {
      userId: newUserSignUpResponse.user._id.toString(),
    };

    args = {
      id: createEventResponse._id,
    };

    // Register for an event before unregistering
    await registerForEvent({}, args, context);

    const response = await unregisterForEvent({}, args, context);

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
