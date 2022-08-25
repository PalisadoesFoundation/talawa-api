const mongoose = require('mongoose');
const shortid = require('shortid');
const { USER_NOT_AUTHORIZED, USER_NOT_FOUND } = require('../../../constants');
const database = require('../../../db');
const { User } = require('../../../lib/models');
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

  test('Testing, when the loggedIn user is not SUPERADMIN in accept admin', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    const args = {
      id: userId,
    };

    await expect(async () => {
      await acceptAdmin({}, args, {
        userId,
      });
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Testing, when user is not found in accept admin', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const context = {
      userId,
    };

    const args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await acceptAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
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

  test('Testing, when the loggedIn user is not SUPERADMIN in reject admin', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    const args = {
      id: userId,
    };

    await expect(async () => {
      await rejectAdmin({}, args, {
        userId,
      });
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Testing, when user is not found in reject admin', async () => {
    const generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    const userId = await getUserId(generatedEmail);

    await User.findByIdAndUpdate({ _id: userId }, { userType: 'SUPERADMIN' });

    const context = {
      userId,
    };

    const args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await rejectAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
