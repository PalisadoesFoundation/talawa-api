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
    console.log(response);

    response.map((event) => {
      expect(event.status).toEqual('ACTIVE');
      expect(event.title).toEqual('Talawa Conference Test');
      expect(event.description).toEqual(
        'National conference that happens yearly'
      );
      expect(typeof event.isPublic === 'boolean').toBeTruthy();
      expect(typeof event.isRegisterable === 'boolean').toBeTruthy();
      expect(typeof event.recurring === 'boolean').toBeTruthy();
      expect(event.recurrance).toEqual('YEARLY');
      expect(event.location).toEqual('Test');
      expect(event.startDate).toEqual('2/2/2020');
      expect(typeof event.allDay === 'boolean').toBeTruthy();
      expect(event.startTime).toEqual('1:00 PM');
      expect(event.endTime).toEqual('2:00 PM');
    });
  });
});
