/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import type { InterfaceAuthenticatedRequest } from "../../src/middleware/isAuth";
import { isAuth, isAuthMiddleware } from "../../src/middleware/isAuth";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { logger } from "../../src/libraries/logger";
import {
  ACCESS_TOKEN_SECRET,
  UNAUTHENTICATED_ERROR,
} from "../../src/constants";

vi.mock("../../src/libraries/requestContext", () => ({
  translate: (message: string): string => message,
}));

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

describe("isAuthMiddleware", () => {
  let mockRequest: Partial<InterfaceAuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    nextFunction = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call next() when user is authenticated", () => {
    // Mock successful token verification
    vi.spyOn(jwt, "verify").mockImplementationOnce((...args: any) => {
      const decoded = {
        userId: "ValidUserId",
      };
      const callBackFn = args[2];
      return callBackFn(null, decoded);
    });

    mockRequest.headers = {
      authorization: "Bearer validToken",
    };

    isAuthMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.isAuth).toBe(true);
    expect(mockRequest.userId).toBe("ValidUserId");
    expect(mockRequest.tokenExpired).toBeUndefined();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should return 401 when token is not present", () => {
    isAuthMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: UNAUTHENTICATED_ERROR.MESSAGE,
      expired: undefined,
    });
  });
});
