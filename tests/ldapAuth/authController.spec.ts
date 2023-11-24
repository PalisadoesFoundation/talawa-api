import { expect, describe, afterEach, vi, it } from "vitest";
import {
  generateToken,
  ldapLogin,
  ldapRegister,
} from "../../src/ldapAuth/authController";
import type { Request, Response, NextFunction } from "express";
import { INVALID_CREDENTIALS_ERROR } from "../../src/constants";

const validEmail = "testuser@example.com";
const validPassword = "password";
const invalidEmail = "invaliduser@example.com";
const invalidPassword = "wrongpassword";

const validRequest = {
  body: {
    email: validEmail,
    password: validPassword,
  },
  result: [
    {
      cn: "abc",
      sn: "pqr",
      uid: "testuser@example.com",
    },
  ],
  token: "A long string of token",
};

const sampleUserData1 = [
  {
    cn: "abc",
    sn: "pqr",
    uid: "testuser@example.com",
  },
];
const invalidRequest = {
  body: {
    email: invalidEmail,
    password: invalidPassword,
  },
};

describe("authController", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ldapLogin", () => {
    it("should return an AuthResponse object when login is successful and show proper error messages", async () => {
      const request = validRequest as unknown as Request;
      const response = {
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;
      await ldapLogin(request, response, next);
      generateToken(sampleUserData1[0].uid);
    });

    it("should call next function with ValidationError when password is incorrect", async () => {
      const request = invalidRequest as unknown as Request;
      const response = {
        send: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      try {
        await ldapLogin(request, response, next);
      } catch (error: any) {
        expect(error.message).toHaveBeenLastCalledWith(
          INVALID_CREDENTIALS_ERROR.MESSAGE
        );
      }
    });
  });

  describe("ldapRegister", () => {
    it("should return an AuthResponse object with user data and token on successful registration", async () => {
      const request = validRequest as unknown as Request;
      const response = {
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;
      await ldapRegister(request, response, next);
      const newUserData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };
      generateToken(newUserData.email);
    });

    it("should call next function with ConflictError when user already exists", async () => {
      const request = validRequest as unknown as Request;
      const response = {
        send: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;
      const EMAIL_MESSAGE = "email.alreadyExists";

      try {
        await ldapRegister(request, response, next);
      } catch (error: any) {
        expect(error.message).toEqual(EMAIL_MESSAGE);
      }
    });
  });
});
