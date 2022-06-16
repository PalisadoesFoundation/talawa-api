const recaptcha = require('../../../lib/resolvers/auth_mutations/recaptcha');

describe('Testing recaptcha resolver', () => {
  test('recaptcha', async () => {
    const args = {
      data: {
        recaptchaToken: 'dummyToken',
      },
    };

    const response = await recaptcha({}, args);
    expect(response).toBeFalsy();
  });
});
