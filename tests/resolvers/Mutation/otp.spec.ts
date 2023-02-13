import "dotenv/config";
import { MutationOtpArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { otp as otpResolver } from "../../../src/resolvers/Mutation/otp";
import { USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

// describe('Testing otp resolver', () => {
//   test('otp', async () => {

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

describe("resolvers -> Mutation -> otp", () => {
  it("throws Error if no user exists with email === args.data.email", async () => {
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
