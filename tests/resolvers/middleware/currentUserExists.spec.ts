/* eslint-disable @typescript-eslint/no-explicit-any */
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { currentUserExists } from "../../../src/resolvers/middleware/currentUserExists";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { requestContext } from "../../../src/libraries";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Middleware -> currentUserExists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

<<<<<<< HEAD
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await composedResolver({}, {}, context, {});
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
=======
  it("Test: User Exists", async () => {
    vi.spyOn(requestContext, "translate").mockImplementation(
      (): string => "test error message",
    );
    const context = {
      userId: testUser?.id.toString(),
    };
    const next = vi.fn().mockReturnValue("next executed");
    const functionCall = await currentUserExists()(next)({}, {}, context, {});
    expect(functionCall).toBe("next executed");
>>>>>>> develop
  });

  it("Test: User does not exist", async () => {
    vi.spyOn(requestContext, "translate").mockImplementation(
      (): string => "test error message",
    );
    const context = {
<<<<<<< HEAD
      userId: testUser?.id.toString(),
=======
      userId: Types.ObjectId().toString(),
>>>>>>> develop
    };
    const next = vi.fn();
    await expect(
      async () => await currentUserExists()(next)({}, {}, context, {}),
    ).rejects.toThrowError("test error message");
  });
});
