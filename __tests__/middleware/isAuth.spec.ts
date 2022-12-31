import { Request } from "express";
import { isAuth } from "../../src/lib/middleware/isAuth";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";

interface Test_Interface_AuthData {
  isAuth: boolean;
  expired: boolean | undefined;
  userId: string | undefined;
}

let testAuthData: Test_Interface_AuthData;

describe("middleware -> isAuth", () => {
  beforeEach(() => {
    testAuthData = {
      isAuth: false,
      expired: undefined,
      userId: undefined,
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns authData if headers.authorisation === undefined", () => {
    const mockRequest = {
      headers: {},
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token === undefined", () => {
    const mockRequest = {
      headers: {
        authorization: "Token",
      },
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if token === ''", async () => {
    const mockRequest = {
      headers: {
        authorization: "Token ",
      },
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

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

    const mockRequest = {
      headers: {
        authorization: "Token Expired",
      },
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

    testAuthData.expired = true;

    expect(verifyMocked).toHaveBeenCalledWith(
      "Expired",
      process.env.ACCESS_TOKEN_SECRET as string,
      expect.anything()
    );
    expect(authData).toEqual(testAuthData);
  });

  it("returns authData if jwt.verify throws error", () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce((..._args: any) => {
      throw new Error();
    });

    const mockRequest = {
      headers: {
        authorization: "Token SomeToken",
      },
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

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

    const mockRequest = {
      headers: {
        authorization: "Token Valid",
      },
    } as Request;

    const authData: Test_Interface_AuthData = isAuth(mockRequest);

    testAuthData.isAuth = true;
    testAuthData.userId = "ValidUserId";

    expect(verifyMocked).toHaveBeenCalledWith(
      "Valid",
      process.env.ACCESS_TOKEN_SECRET as string,
      expect.anything()
    );
    expect(authData).toEqual(testAuthData);
  });
});
