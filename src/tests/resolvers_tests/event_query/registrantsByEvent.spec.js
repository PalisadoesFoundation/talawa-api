const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const registrantsByEvent = require('../../../lib/resolvers/event_query/registrantsByEvent');
const { EVENT_NOT_FOUND } = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Registrants By Event Query without existing Event', async () => {
    const args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await registrantsByEvent({}, args);
    }).rejects.toEqual(Error(EVENT_NOT_FOUND));
  });

  test('Registrants By Event Query', async () => {
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
      id: createEventResponse._id,
    };

    const response = await registrantsByEvent({}, args);
    response.map((registrant) => {
      expect(registrant.appLanguageCode).toEqual('en');
      expect(registrant.userType).toEqual('USER');
      expect(registrant.status).toEqual('ACTIVE');
      expect(registrant.pluginCreationAllowed).toEqual(true);
      expect(typeof registrant.firstName === 'string').toBeTruthy();
      expect(typeof registrant.lastName === 'string').toBeTruthy();
      expect(typeof registrant.email === 'string').toBeTruthy();
      expect(registrant.password).toEqual(null);
      expect(registrant.organizationUserBelongsTo).toEqual(null);
      expect(registrant.image).toEqual(null);
    });
  });
});
