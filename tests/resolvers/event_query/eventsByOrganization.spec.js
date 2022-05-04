const shortid = require('shortid');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const eventsByOrganization = require('../../../lib/resolvers/event_query/eventsByOrganization');
let createOrgResponse;
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();

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

  createOrgResponse = await createOrganization({}, args, context);

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

  await createEvent({}, args, context);
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  const orderByArgs = [
    'id_ASC',
    'id_DESC',
    'title_ASC',
    'title_DESC',
    'description_ASC',
    'description_DESC',
    'startDate_ASC',
    'startDate_DESC',
    'endDate_ASC',
    'endDate_DESC',
    'allDay_ASC',
    'allDay_DESC',
    'startTime_ASC',
    'startTime_DESC',
    'endTime_ASC',
    'endTime_DESC',
    'recurrance_ASC',
    'recurrance_DESC',
    'location_ASC',
    'location_DESC',
  ];

  orderByArgs.map((arg) => {
    test(`Events By Organization Query with orderBy ${arg}`, async () => {
      let args = {
        orderBy: arg,
        id: createOrgResponse._id,
      };

      const response = await eventsByOrganization({}, args);
      response.map((event) => {
        expect(event.title).toEqual('Talawa Conference Test');
        expect(event.description).toEqual(
          'National conference that happens yearly'
        );
        expect(event.status).toEqual('ACTIVE');
        expect(event.recurrance).toEqual('YEARLY');
        expect(event.location).toEqual('Test');
        expect(event.startDate).toEqual('2/2/2020');
        expect(event.endDate).toEqual('2/2/2022');
        expect(event.endTime).toEqual('2:00 PM');
        expect(event.startTime).toEqual('1:00 PM');
      });
    });
  });
});
