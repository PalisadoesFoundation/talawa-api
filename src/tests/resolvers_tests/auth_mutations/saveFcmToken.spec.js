const mongoose = require('mongoose');
const shortid = require('shortid');
const { USER_NOT_FOUND } = require('../../../constants');
const database = require('../../../db');
const saveFcmToken = require('../../../lib/resolvers/auth_mutations/saveFcmToken');
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

describe('Testing save fcm resolver', () => {
  test('Save Fcm Token', async () => {
    const context = {
      userId,
    };

    const response = await saveFcmToken({}, {}, context);

    expect(response).toBeTruthy();
  });

  test('Testing, when user is not found', async () => {
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await saveFcmToken({}, {}, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
