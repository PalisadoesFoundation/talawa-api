import 'dotenv/config';
import { MutationOtpArgs } from 'src/generated/graphQLTypescriptTypes';
import { Document } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { connect, disconnect } from '../../../db';
import { otp as otpResolver } from '../../../lib/resolvers/Mutation/otp';
import { USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });
});

afterAll(async () => {
  await disconnect();
});

// describe('Testing otp resolver', () => {
//   test('otp', async () => {
//     console.log(token);

//     const args = {
//       data: {
//         email: generatedEmail,
//       },
//     };

//     await expect(() => otp({}, args)).rejects.toEqual(ERROR_IN_SENDING_MAIL);
//   });

//   test('Testing, when user email is incorrect', async () => {
//     const args = {
//       data: {
//         email: 'abc4321@email.com',
//       },
//     };

//     await expect(async () => {
//       await otp({}, args);
//     }).rejects.toEqual(Error(USER_NOT_FOUND));
//   });
// });

describe('resolvers -> Mutation -> otp', () => {
  it('throws Error if no user exists with email === args.data.email', async () => {
    try {
      const args: MutationOtpArgs = {
        data: {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
        },
      };

      await otpResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });
});
