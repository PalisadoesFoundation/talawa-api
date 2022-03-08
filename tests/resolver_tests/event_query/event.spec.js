const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganisation = require('../../../lib/resolvers/organization_mutations/createOrganization');
const removeOrganisation = require('../../../lib/resolvers/organization_mutations/removeOrganization');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const getEvent = require('../../../lib/resolvers/event_query/event');
const removeEvent = require('../../../lib/resolvers/event_mutations/removeEvent');
require('../../../lib/models/Task');
const shortid = require('shortid');
const axios = require('axios');
const { URL } = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  let context;
  let organizationId;
  let eventId;
  let userId;
  const name = shortid.generate().toLowerCase();
  const startDateOfEvent = new Date().toLocaleDateString();

  beforeAll(async () => {
    // signup and login to create an event
    const email = `${name}@test.com`;
    const signupArgs = {
      data: {
        firstName: name,
        lastName: name,
        email: email,
        password: 'password',
      },
    };
    const response = await signup({}, signupArgs);
    // this userId will be used to create a new event
    userId = response.user._id;
    context = {
      userId: String(userId),
    };
    // create an org
    const orgName = shortid.generate().toLowerCase();
    const createOrganisationArgs = {
      data: {
        name: orgName,
        description: orgName,
        isPublic: true,
        visibleInSearch: true,
      },
    };
    const createdOrganisation = await createOrganisation(
      {},
      createOrganisationArgs,
      context
    );
    organizationId = createdOrganisation._id;
    // create an event
    const createEventArgs = {
      data: {
        title: name,
        description: name,
        startDate: startDateOfEvent,
        startTime: '10:00 AM',
        endTime: '3:00 PM',
        endDate: startDateOfEvent,
        allDay: false,
        recurring: false,
        isPublic: true,
        isRegisterable: true,
        organizationId,
        tasks: [],
      },
    };
    const createdEvent = await createEvent({}, createEventArgs, context);
    eventId = createdEvent._id;
  });

  // finally delete that event ,org and user regardless of test passing or failing.
  afterAll(async () => {
    const removeOrganisationArgs = {
      id: organizationId,
    };
    await removeOrganisation({}, removeOrganisationArgs, context);
  });

  test('should return the created event', async () => {
    // query that event
    const getEventArgs = {
      id: eventId,
    };
    const event = await getEvent({}, getEventArgs);

    // check the event now.
    expect(event).toEqual(
      expect.objectContaining({
        _id: eventId,
        title: name,
        description: name,
        startDate: startDateOfEvent,
        startTime: '10:00 AM',
        endTime: '3:00 PM',
        endDate: startDateOfEvent,
        creator: expect.objectContaining({
          _id: userId,
        }),
        organization: expect.objectContaining({
          _id: organizationId,
        }),
        allDay: false,
        recurring: false,
        isPublic: true,
        isRegisterable: true,
        status: 'ACTIVE',
      })
    );
    const removeEventArgs = {
      id: eventId,
    };
    await removeEvent({}, removeEventArgs, context);
  });

  test('api call should return an error event not found', async () => {
    // query that event
    const response = await axios.post(URL, {
      query: `
        query {
          event (id: "${eventId}"){
            _id
        }
      }
      `,
    });
    const { data } = response;
    // check the event now.
    expect(data).toEqual(
      expect.objectContaining({
        errors: expect.objectContaining([
          {
            message: 'Event not found',
            status: 422,
            data: [
              {
                message: 'Event not found',
                code: 'event.notFound',
                param: 'event',
                metadata: {},
              },
            ],
          },
        ]),
        data: expect.objectContaining({
          event: null,
        }),
      })
    );
  });

  test('api call should return a cast error', async () => {
    // query that event
    const invalidId = '1';
    const response = await axios.post(URL, {
      query: `
        query {
          event (id: ${invalidId}){
            _id
        }
      }
      `,
    });
    const { data } = response;
    // check the event now.
    expect(data).toEqual(
      expect.objectContaining({
        errors: expect.objectContaining([
          {
            message: `Cast to ObjectId failed for value "${invalidId}" (type string) at path "_id" for model "Event"`,
            status: 422,
            data: [],
          },
        ]),
        data: expect.objectContaining({
          event: null,
        }),
      })
    );
  });
});
