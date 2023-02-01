import "dotenv/config";
import { MutationOtpArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { otp as otpResolver } from "../../../src/resolvers/Mutation/otp";
import { USER_NOT_FOUND, ACCESS_TOKEN_SECRET } from "../../../src/constants";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import nodemailer from "nodemailer";

import { User } from "../../../src/models";

// create a mock implementation for the nodemailer library
vi.mock("nodemailer", () => {
  return {
    createTransport: vi.fn().mockImplementation(() => {
      return {
        sendMail: vi.fn().mockImplementation(() => {
          return Promise.resolve({ response: "Email sent" });
        }),
      };
    }),
  };
});

const mockTransporter = require("nodemailer");

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> otp", () => {
  it("throws Error if no user exists with email === args.data.email", async () => {
    try {
      const args: MutationOtpArgs = {
        data: {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
        },
      };

      await otpResolver(null, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it("generates and returns a new OTP token with a valid user", async () => {
    const user = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    });

    const args: MutationOtpArgs = {
      data: {
        email: user.email,
      },
    };

    const { otpToken } = await otpResolver(null, args, {});
    const decodedToken = jwt.verify(otpToken, ACCESS_TOKEN_SECRET!);

    expect(typeof decodedToken).toEqual("object");
    expect(decodedToken.email).toEqual(user.email);
    expect(decodedToken.otp).toBeDefined();

    // check if the nodemailer library was called
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalled();
  });
  it("sends an email with the OTP", async () => {
    const user = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    });

    const args: MutationOtpArgs = {
      data: {
        email: user.email,
      },
    };

    const { otpToken } = await otpResolver(null, args, {});
    expect(mockTransporter.createTransport().sendMail).toHaveBeenCalled();
  });
});
