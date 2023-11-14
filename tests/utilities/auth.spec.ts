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
    expect((decodedToken as any).tokenVersion).toBe(user?.tokenVersion);
    expect((decodedToken as any).userId).toBe(
      user && user._id ? user._id.toString() : undefined
    );
    expect((decodedToken as any).firstName).toBe(user?.firstName);
    expect((decodedToken as any).lastName).toBe(user?.lastName);
    expect((decodedToken as any).email).toBe(user?.email);
  });
});

describe("createRefreshToken", () => {
  it("should create a JWT token with the correct payload", () => {
    const token = createRefreshToken(
      user ? user.toObject() : ({} as InterfaceUser)
    );

    expect(token).toBeDefined();

    const decodedToken = jwt.decode(token);

    expect((decodedToken as any).tokenVersion).toBe(user?.tokenVersion);
    expect((decodedToken as any).userId).toBe(
      user && user._id ? user._id.toString() : undefined
    );
    expect((decodedToken as any).firstName).toBe(user?.firstName);
    expect((decodedToken as any).lastName).toBe(user?.lastName);
    expect((decodedToken as any).email).toBe(user?.email);
  });
});

describe("revokeRefreshToken", () => {
  it("should unset the token field in the user document", async () => {
    await revokeRefreshToken(user?._id);

    const updatedUser = await User.findOne({ _id: user?._id });

    expect(updatedUser?.token).toBeUndefined();
  });
});
