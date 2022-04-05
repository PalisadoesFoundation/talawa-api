const shortid = require('shortid');
const getUserId = require('./getUserIdFromSignup');
const superAdminCheck = require('../../lib/resolvers/functions/superAdminCheck');

let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);
});

describe('Testing is the user is Super Admin', () => {
  test('should not throw an error if current user is of type : SUPERADMIN', () => {
    expect(() => {
      superAdminCheck({ userId: userId }, { userType: 'SUPERADMIN' });
    }).not.toThrow('User is not authorized for performing this operation');
  });

  test('should throw an error if current user is of type : USER', () => {
    expect(() => {
      superAdminCheck({ userId: userId }, { userType: 'USER' });
    }).toThrow('User is not authorized for performing this operation');
  });

  test('should throw an error if current user is of type : ADMIN', () => {
    expect(() => {
      superAdminCheck({ userId: userId }, { userType: 'ADMIN' });
    }).toThrow('User is not authorized for performing this operation');
  });
});
