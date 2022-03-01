const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganisation = require('../../../lib/resolvers/organization_mutations/createOrganization');
const removeOrganisation = require('../../../lib/resolvers/organization_mutations/removeOrganization');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const getEvent = require('../../../lib/resolvers/event_query/event');
const removeEvent = require('../../../lib/resolvers/event_mutations/removeEvent');
require('../../../lib/models/Task');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Event query', async () => {
    // signup and login to create an event
    const name = shortid.generate().toLowerCase();
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
    const userId = response.user._id;
    const context = {
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
    const organizationId = createdOrganisation._id;
    // create an event
    const startDateOfEvent = new Date().toLocaleDateString();
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
    const eventId = createdEvent._id;
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
    // finally delete that event ,org and user regardless of test passing or failing.
    const removeEventArgs = {
      id: eventId,
    };
    await removeEvent({}, removeEventArgs, context);
    const removeOrganisationArgs = {
      id: organizationId,
    };
    await removeOrganisation({}, removeOrganisationArgs, context);
  });
});
