const shortid = require('shortid');

const database = require('../../../db');
const User = require('../../../lib/models/User');
const {
  acceptAdmin,
  rejectAdmin,
} = require('../../../lib/resolvers/admin_mutations/adminRequest');
const getUserId = require('../../functions/getUserIdFromSignup');

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Testing admin request resolver', () => {
  test('Testing accept request', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const args = {
      id: userId,
    };

    const response = await acceptAdmin({}, args, {
      userId,
    });

    expect(response).toBeTruthy();
  });

  test('Testing reject request', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const args = {
      id: userId,
    };

    const response = await rejectAdmin({}, args, {
      userId,
    });

    expect(response).toBeTruthy();
  });
});
