/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import { isAuth } from "../../src/middleware/isAuth";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { logger } from "../../src/libraries/logger";
import { ACCESS_TOKEN_SECRET } from "../../src/constants";

interface TestInterfaceAuthData {
  isAuth: boolean;
  expired: boolean | undefined;
  userId: string | undefined;
}

let testAuthData: TestInterfaceAuthData;

describe("middleware -> isAuth", () => {
  beforeEach(() => {
    testAuthData = {
      isAuth: false,
      expired: undefined,
      userId: undefined,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns authData if headers.authorisation === undefined", () => {
    const mockRequest = {
      headers: {},
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token === undefined", () => {
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5);

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token === ''", () => {
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5)
      .concat(" ");

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token is expired", () => {
    const verifyMocked = vi
      .spyOn(jwt, "verify")
      .mockImplementationOnce((...args: any) => {
        const err = {
          name: "TokenExpiredError",
        };

        const callBackFn = args[2];
        return callBackFn(err, {});
      });

    const testToken = (Math.random() + 1).toString(36).substring(2, 5);
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5)
      .concat(" ", testToken);

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    testAuthData.expired = true;

    expect(verifyMocked).toHaveBeenCalledWith(
      testToken,
      ACCESS_TOKEN_SECRET as string,
      expect.anything(),
    );
    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if decoded token is not set", () => {
    const verifyMocked = vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return "";
    });

    const infoSpy = vi.spyOn(logger, "info");

    const testToken = (Math.random() + 1).toString(36).substring(2, 5);
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5)
      .concat(" ", testToken);

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    expect(verifyMocked).toHaveBeenCalledWith(
      testToken,
      ACCESS_TOKEN_SECRET as string,
      expect.anything(),
    );
    expect(infoSpy).toBeCalledWith("decoded token is not present");
    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if jwt.verify throws error", () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      throw new Error();
    });

    const testToken = (Math.random() + 1).toString(36).substring(2, 5);
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5)
      .concat(" ", testToken);

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    testAuthData.expired = true;

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token is valid", () => {
    const verifyMocked = vi
      .spyOn(jwt, "verify")
      .mockImplementationOnce((...args: any) => {
        const decoded = {
          userId: "ValidUserId",
        };

        const callBackFn = args[2];
        return callBackFn(null, decoded);
      });

    const testToken = (Math.random() + 1).toString(36).substring(2, 5);
    const testAuthorizationHeader = (Math.random() + 1)
      .toString(36)
      .substring(2, 5)
      .concat(" ", testToken);

    const mockRequest = {
      headers: {
        authorization: testAuthorizationHeader,
      },
    } as Request;

    const authData: TestInterfaceAuthData = isAuth(mockRequest);

    testAuthData.isAuth = true;
    testAuthData.userId = "ValidUserId";

    expect(verifyMocked).toHaveBeenCalledWith(
      testToken,
      ACCESS_TOKEN_SECRET as string,
      expect.anything(),
    );
    expect(authData).toEqual(testAuthData);
  });
});
