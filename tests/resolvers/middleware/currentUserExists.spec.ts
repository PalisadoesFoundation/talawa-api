import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { currentUserExists } from "../../../src/resolvers/middleware/currentUserExists";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
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
import { User } from "../../../src/models/User";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let composedResolver: any;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  composedResolver = currentUserExists();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

const mockReq: any = () => {
  const req = {
    args: {},
    context: {},
    info: {},
  };
  return req;
};

describe("resolvers -> Middleware -> currentUserExists", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };
      mockReq.context = context;
      await composedResolver(mockReq)({}, {}, context, {});
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws no error if a user exists with _id === context.userId`, async () => {
    const context = {
      userId: testUser!.id.toString(),
    };
    mockReq.context = context;
    User.exists = vi.fn().mockResolvedValue(true);
    const nextResolver = await composedResolver(mockReq)({}, {}, context, {});
    expect(User.exists).toHaveBeenCalledWith({ _id: context.userId });
    expect(nextResolver).not.toBeNull();
  });
});
