const Database = require('../../lib/Database/index');
const User = require('../../lib/Database/MongoImplementation/schema/User');
const { DATABASE_CONNECTION_FAIL } = require('../../constants');

const firstUrl = 'mongodb://localhost:27017/db1?retryWrites=true&w=majority';
const secondUrl = 'mongodb://localhost:27017/db2?retryWrites=true&w=majority';

// not using an options.schema would result in creating a database
// with all valid schema parts.
const firstDB = new Database(firstUrl);
const secondDB = new Database(secondUrl, {
  schema: {
    User,
  },
});

const FirstUserObject = firstDB.User;
const SecondUserObject = secondDB.User;

beforeAll(async () => {
  await firstDB.connect();
  await secondDB.connect();
});

afterAll(async () => {
  await firstDB.User.deleteMany({});
  await secondDB.User.deleteMany({});
  await firstDB.disconnect();
  await secondDB.disconnect();
});

describe('testing multiple databases functionality', () => {
  test('inavlid url throws an error', async () => {
    await expect(async () => {
      const db = new Database('some_invalid_url');
      await db.connect();
    }).rejects.toThrow(DATABASE_CONNECTION_FAIL);
  });

  test('first db is working', async () => {
    const firstDbUser = new FirstUserObject({
      firstName: 'test',
      lastName: 'test',
      email: 'test@gmail.com',
      password: 'testpassword',
    });

    await firstDbUser.save();
    let usr1 = await FirstUserObject.findOne({ firstName: 'test' });
    let usr2 = await SecondUserObject.findOne({ firstName: 'test' });
    expect(usr1.firstName).toBe('test');
    expect(usr2).toBeFalsy();
    await FirstUserObject.deleteMany({ firstName: 'test' });
    usr1 = await FirstUserObject.findOne({ firstName: 'test' });
    expect(usr1).toBeFalsy();
  });

  test('second db is working', async () => {
    const secondDbUser = new SecondUserObject({
      firstName: 'test',
      lastName: 'test',
      email: 'test@gmail.com',
      password: 'testpassword',
    });

    await secondDbUser.save();
    let usr1 = await FirstUserObject.findOne({ firstName: 'test' });
    let usr2 = await SecondUserObject.findOne({ firstName: 'test' });
    expect(usr2.firstName).toBe('test');
    expect(usr1).toBeFalsy();
    await SecondUserObject.deleteMany({ firstName: 'test' });
    usr2 = await SecondUserObject.findOne({ firstName: 'test' });
    expect(usr2).toBeFalsy();
  });
});
