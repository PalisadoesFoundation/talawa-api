import { MutationRecaptchaArgs } from '../../../generated/graphQLTypescriptTypes';
import { recaptcha as recaptchaResolver } from '../../../lib/resolvers/Mutation/recaptcha';

describe('resolvers -> Mutation -> recaptcha', () => {
  test('', async () => {
    const args: MutationRecaptchaArgs = {
      data: {
        recaptchaToken: 'dummyToken',
      },
    };

    const recaptchaPayload = await recaptchaResolver?.({}, args, {});

    expect(recaptchaPayload).toBeFalsy();
  });
});
