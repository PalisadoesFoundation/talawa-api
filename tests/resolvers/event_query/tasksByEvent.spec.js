const shortid = require('shortid');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const createTask = require('../../../lib/resolvers/project_task_mutations/createTask');
const tasksByEvent = require('../../../lib/resolvers/event_query/tasksByEvent');
let createEventResponse;

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

  createEventResponse = await createEvent({}, args, context);

  args = {
    eventId: createEventResponse._id,
    data: {
      title: 'title',
      description: 'description',
      status: 'ACTIVE',
    },
  };

  await createTask({}, args, context);
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
    'createdAt_ASC',
    'createdAt_DESC',
    'deadline_ASC',
    'deadline_DESC',
  ];

  orderByArgs.map((arg) => {
    test(`Tasks By Event Query with orderBy ${arg}`, async () => {
      let args = {
        orderBy: arg,
        id: createEventResponse._id,
      };

      const response = await tasksByEvent({}, args);
      response.map((task) => {
        expect(task.title).toEqual('title');
        expect(task.description).toEqual('description');
        expect(task.status).toEqual('ACTIVE');
      });
    });
  });
});
