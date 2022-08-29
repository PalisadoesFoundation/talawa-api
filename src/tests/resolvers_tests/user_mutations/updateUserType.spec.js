const mongoose = require('mongoose');
const shortid = require('shortid');
const { USER_NOT_AUTHORIZED, USER_NOT_FOUND } = require('../../../constants');
const database = require('../../../db');
const { User } = require('../../../lib/models');
const updateUserType = require('../../../lib/resolvers/user_mutations/updateUserType');
const { getUserIdFromSignUp } = require('../../helperFunctions');

let userId;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserIdFromSignUp(generatedEmail);
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

  test('Testing, when user is not super admin', async () => {
    await User.findByIdAndUpdate({ _id: userId }, { userType: 'ADMIN' });

    const args = {
      data: {
        id: userId,
        userType: 'SUPERADMIN',
      },
    };

    await expect(async () => {
      await updateUserType({}, args, {
        userId,
      });
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Testing, when user is not found', async () => {
    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const args = {
      data: {
        id: mongoose.Types.ObjectId(),
        userType: 'SUPERADMIN',
      },
    };

    await expect(async () => {
      await updateUserType({}, args, {
        userId,
      });
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
