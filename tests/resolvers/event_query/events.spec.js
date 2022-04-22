const eventsQuery = require('../../../lib/resolvers/event_query/events');
const database = require('../../../db');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
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
    test(`Events Query with orderBy ${arg}`, async () => {
      const args = {
        orderBy: arg,
      };
      const response = await eventsQuery({}, args);
      response.map((event) => {
        console.log(event.location, typeof event.location);
        expect(typeof event.status === 'string').toBeTruthy();
        expect(typeof event.title === 'string').toBeTruthy();
        expect(typeof event.description === 'string').toBeTruthy();
        expect(typeof event.isPublic === 'boolean').toBeTruthy();
        expect(typeof event.isRegisterable === 'boolean').toBeTruthy();
        expect(typeof event.recurring === 'boolean').toBeTruthy();
        expect(typeof event.recurrance === 'string').toBeTruthy();
        expect(
          typeof event.location === 'string' ||
          typeof event.location === 'object' ||
          event.location === null
        ).toBeTruthy();
        expect(typeof event.startDate === 'string').toBeTruthy();
        expect(typeof event.allDay === 'boolean').toBeTruthy();
        expect(typeof event.startTime === 'string').toBeTruthy();
        expect(typeof event.endTime === 'string').toBeTruthy();
      });
    });
  });
});
