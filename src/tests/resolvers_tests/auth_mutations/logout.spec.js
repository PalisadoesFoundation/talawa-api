const mongoose = require('mongoose');
const shortid = require('shortid');
const { USER_NOT_FOUND } = require('../../../constants');
const database = require('../../../db');
const logout = require('../../../lib/resolvers/auth_mutations/logout');
const { getAccessToken, getUserIdFromLogin } = require('../../helperFunctions');

let generatedEmail;
let userId;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();

  generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  await getAccessToken(generatedEmail);
  userId = await getUserIdFromLogin(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

describe('Testing logout resolver', () => {
  test('Logout user', async () => {
    const context = {
      userId,
    };

    const response = await logout({}, {}, context);

    expect(response).toBeTruthy();
  });

  test('Testing, when user is not found', async () => {
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await logout({}, {}, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
