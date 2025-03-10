import jwt from "jsonwebtoken";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { InterfaceAppUserProfile, InterfaceUser } from "../../src/models";
import { AppUserProfile, Community, User } from "../../src/models";
import {
  createAccessToken,
  createRefreshToken,
  revokeRefreshToken,
} from "../../src/utilities";
import { connect, disconnect } from "../helpers/db";
import type { TestUserType } from "../helpers/user";
import { createTestUserFunc } from "../helpers/user";
import type { TestAppUserProfileType } from "../helpers/userAndOrg";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "@constants";

let user: TestUserType;
let appUserProfile: TestAppUserProfileType;
let MONGOOSE_INSTANCE: typeof mongoose;
export interface InterfaceJwtTokenPayload {
  timeout: number;
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  user = await createTestUserFunc();
  appUserProfile = await AppUserProfile.findOne({
    userId: user?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("createAccessToken", () => {
  it("should use the timeout from the Community document if it exists", async () => {
    // Set up a Community document with a specific timeout
    const community = await Community.create({
      name: "Test Community",
      timeout: 45, // Custom timeout in minutes
    });

    const token = await createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect(decodedToken).not.toBeNull();
    expect((decodedToken as InterfaceJwtTokenPayload).timeout).toBe(
      community.timeout,
    );

    // Clean up
    await Community.deleteMany({});
  });

  it("should default to 30 minutes if no Community document exists", async () => {
    // Ensure no Community documents exist
    await Community.deleteMany({});

    const token = await createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect(decodedToken).not.toBeNull();
    expect((decodedToken as InterfaceJwtTokenPayload).timeout).toBe(30);
  });

  it("should create a JWT token with the correct payload", async () => {
    const token = await createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect(decodedToken).not.toBeNull();
    expect((decodedToken as InterfaceJwtTokenPayload).tokenVersion).toBe(
      appUserProfile?.tokenVersion,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).userId).toBe(
      user && user._id ? user._id.toString() : undefined,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).firstName).toBe(
      user?.firstName,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).lastName).toBe(
      user?.lastName,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).email).toBe(user?.email);
  });
  it("should use the correct expiration time in the token", async () => {
    const jwtSignSpy = vi.spyOn(jwt, "sign");

    await createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(jwtSignSpy).toHaveBeenCalledWith(
      expect.any(Object),
      ACCESS_TOKEN_SECRET,
      expect.objectContaining({
        expiresIn: "40m",
      }),
    );

    jwtSignSpy.mockRestore();
  });
  it("should use ACCESS_TOKEN_SECRET for signing the token", async () => {
    const jwtSignSpy = vi.spyOn(jwt, "sign");

    await createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(jwtSignSpy).toHaveBeenCalledWith(
      expect.any(Object),
      ACCESS_TOKEN_SECRET,
      expect.any(Object),
    );

    jwtSignSpy.mockRestore();
  });
});

describe("createRefreshToken", () => {
  it("should create a JWT token with the correct payload", () => {
    const token = createRefreshToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect((decodedToken as InterfaceJwtTokenPayload).tokenVersion).toBe(
      appUserProfile?.tokenVersion,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).userId).toBe(
      user && user._id ? user._id.toString() : undefined,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).firstName).toBe(
      user?.firstName,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).lastName).toBe(
      user?.lastName,
    );
    expect((decodedToken as InterfaceJwtTokenPayload).email).toBe(user?.email);
  });
  it("should use the correct expiration time in the refresh token", () => {
    const jwtSignSpy = vi.spyOn(jwt, "sign");

    createRefreshToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(jwtSignSpy).toHaveBeenCalledWith(
      expect.any(Object),
      REFRESH_TOKEN_SECRET,
      expect.objectContaining({
        expiresIn: "30d",
      }),
    );

    jwtSignSpy.mockRestore();
  });

  it("should use REFRESH_TOKEN_SECRET for signing the token", () => {
    const jwtSignSpy = vi.spyOn(jwt, "sign");

    createRefreshToken(
      user ? user.toObject() : ({} as InterfaceUser),
      appUserProfile
        ? appUserProfile.toObject()
        : ({} as InterfaceAppUserProfile),
    );

    expect(jwtSignSpy).toHaveBeenCalledWith(
      expect.any(Object),
      REFRESH_TOKEN_SECRET,
      expect.any(Object),
    );

    jwtSignSpy.mockRestore();
  });
});

describe("revokeRefreshToken", () => {
  it("should unset the token field in the user document", async () => {
    await revokeRefreshToken(user?._id.toString() ?? "");

    // const updatedUser = await User.findOne({ _id: user?._id });
    const updateAppUserProfile = await AppUserProfile.findOne({
      userId: user?._id,
    });

    expect(updateAppUserProfile?.token).toBeUndefined();
  });

  it("should do nothing if the user does not exist", async () => {
    const findOneSpy = vi.spyOn(User, "findOne").mockResolvedValueOnce(null);
    const findOneAndUpdateSpy = vi.spyOn(User, "findOneAndUpdate");

    const nonExistentUserId = "60c72b2f9b1d8a3e9c8d1234"; // Non-existent user ID
    await revokeRefreshToken(nonExistentUserId);

    expect(findOneSpy).toHaveBeenCalledWith({ _id: nonExistentUserId });
    expect(findOneAndUpdateSpy).not.toHaveBeenCalled();

    findOneSpy.mockRestore();
    findOneAndUpdateSpy.mockRestore();
  });
});
