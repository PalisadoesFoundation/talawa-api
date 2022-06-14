const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const isUserRegister = require('../../../lib/resolvers/event_query/isUserRegister');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const { EVENT_NOT_FOUND } = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Is User Register Mutation without Event', async () => {
    // Random Id inside args for throwing errors
    const args = {
      eventId: mongoose.Types.ObjectId(),
    };

    // No need of user as it the mutation throws error before itself.
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await isUserRegister({}, args, context);
    }).rejects.toEqual(Error(EVENT_NOT_FOUND));
  });

  test('Is User Register Mutation', async () => {
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

    const createEventResponse = await createEvent({}, args, context);

    args = {
      eventId: createEventResponse._id,
    };

    const response = await isUserRegister({}, args, context);

    // As User is an Admin of org and creator of the event, default will be isRegistered as true.
    expect(response.isRegistered).toEqual(true);

    expect(response.event.status).toEqual('ACTIVE');
    expect(response.event.title).toEqual('Talawa Conference Test');
    expect(response.event.description).toEqual(
      'National conference that happens yearly'
    );
    expect(response.event.isPublic).toEqual(event_isPublic_boolean);
    expect(response.event.isRegisterable).toEqual(event_isRegisterable_boolean);
    expect(response.event.recurring).toEqual(event_recurring_boolean);
    expect(response.event.recurrance).toEqual('YEARLY');
    expect(response.event.location).toEqual('Test');
    expect(response.event.startDate).toEqual('2/2/2020');
    expect(response.event.allDay).toEqual(event_allDay_boolean);
    expect(response.event.startTime).toEqual('1:00 PM');
    expect(response.event.endTime).toEqual('2:00 PM');
    expect(response.event.creator._id).toEqual(signUpResponse.user._id);
    expect(response.event.organization).toEqual(createOrgResponse._id);
  });
});
