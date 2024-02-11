import { expect, describe, it, beforeAll, afterAll } from "vitest";
import type mongoose from "mongoose";
import {
  createAccessToken,
  createRefreshToken,
  revokeRefreshToken,
} from "../../src/utilities";
import type { InterfaceUser } from "../../src/models";
import { User } from "../../src/models";
import jwt from "jsonwebtoken";
import type { TestUserType } from "../helpers/user";
import { createTestUserFunc } from "../helpers/user";
import { connect, disconnect } from "../helpers/db";

let user: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
export interface InterfaceJwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  user = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("createAccessToken", () => {
  it("should create a JWT token with the correct payload", async () => {
    const token = createAccessToken(
      user ? user.toObject() : ({} as InterfaceUser)
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect(decodedToken).not.toBeNull();
    expect((decodedToken as InterfaceJwtTokenPayload).tokenVersion).toBe(
      user?.tokenVersion
    );
    expect((decodedToken as InterfaceJwtTokenPayload).userId).toBe(
      user && user._id ? user._id.toString() : undefined
    );
    expect((decodedToken as InterfaceJwtTokenPayload).firstName).toBe(
      user?.firstName
    );
    expect((decodedToken as InterfaceJwtTokenPayload).lastName).toBe(
      user?.lastName
    );
    expect((decodedToken as InterfaceJwtTokenPayload).email).toBe(user?.email);
  });
});

describe("createRefreshToken", () => {
  it("should create a JWT token with the correct payload", () => {
    const token = createRefreshToken(
      user ? user.toObject() : ({} as InterfaceUser)
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect((decodedToken as InterfaceJwtTokenPayload).tokenVersion).toBe(
      user?.tokenVersion
    );
    expect((decodedToken as InterfaceJwtTokenPayload).userId).toBe(
      user && user._id ? user._id.toString() : undefined
    );
    expect((decodedToken as InterfaceJwtTokenPayload).firstName).toBe(
      user?.firstName
    );
    expect((decodedToken as InterfaceJwtTokenPayload).lastName).toBe(
      user?.lastName
    );
    expect((decodedToken as InterfaceJwtTokenPayload).email).toBe(user?.email);
  });
});

describe("revokeRefreshToken", () => {
  it("should unset the token field in the user document", async () => {
    await revokeRefreshToken(user?._id);

    const updatedUser = await User.findOne({ _id: user?._id });

    expect(updatedUser?.token).toBeUndefined();
  });
});
