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
  test('Events Query', async () => {
    const args = {
      orderBy: 'id_ASC',
    };
    const response = await eventsQuery({}, args);
    response.map((event) => {
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
