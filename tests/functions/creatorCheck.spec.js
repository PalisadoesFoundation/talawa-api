const shortid = require('shortid');
const getUserId = require('./getUserIdFromSignup');
const creatorCheck = require('../../lib/resolvers/functions/creatorCheck');

let userId, creatorId;

beforeAll(async () => {
  let generatedUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedUserEmail);
  let generatedCreatorEmail = `${shortid.generate().toLowerCase()}@test.com`;
  creatorId = await getUserId(generatedCreatorEmail);
});

describe('Testing the user to be org creator', () => {
  test('User is the organization creator', () => {
    expect(() => {
      creatorCheck({ userId: userId }, { creator: userId });
    }).not.toThrow('User is not authorized for performing this operation');
  });

  test('User is not the organization creator', () => {
    expect(() => {
      creatorCheck({ userId: userId }, { creator: creatorId });
    }).toThrow('User is not authorized for performing this operation');
  });
});
