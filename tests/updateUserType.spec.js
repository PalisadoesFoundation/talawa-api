const shortid = require('shortid');

const database = require('../db');
const User = require('../lib/models/User');
const updateUserType = require('../lib/resolvers/user_mutations/updateUserType');
const getUserId = require('./functions/getUserIdFromSignup');

let userId;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

describe('Testing update user type resolver', () => {
  test('update user type', async () => {
    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const args = {
      data: {
        id: userId,
        userType: 'SUPERADMIN',
      },
    };

    const response = await updateUserType({}, args, {
      userId,
    });

    expect(response).toBeTruthy();
  });
});
