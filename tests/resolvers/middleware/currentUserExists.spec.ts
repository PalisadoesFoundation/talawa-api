import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { requestContext } from "../../../src/libraries";
import { currentUserExists } from "../../../src/resolvers/middleware/currentUserExists";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

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
  });

  it("Test: User does not exist", async () => {
    vi.spyOn(requestContext, "translate").mockImplementation(
      (): string => "test error message",
    );
    const context = {
      userId: new Types.ObjectId().toString(),
    };
    const next = vi.fn();
    await expect(
      async () => await currentUserExists()(next)({}, {}, context, {}),
    ).rejects.toThrowError("test error message");
  });
});
