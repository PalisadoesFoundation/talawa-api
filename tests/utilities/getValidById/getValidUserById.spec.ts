import { TestUserType } from "../../helpers/userAndOrg";
import mongoose, { Types } from "mongoose";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { connect, disconnect } from "../../helpers/db";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { createTestUser } from "../../helpers/user";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("utilities -> getValidUserById", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("throws error if no user exits with the given id", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const randomTestObejctId = new Types.ObjectId();

    try {
      const { getValidUserById } = await import("../../../src/utilities");

      await getValidUserById(randomTestObejctId);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }

    expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  it("returns valid User with matching id", async () => {
    const { getValidUserById } = await import("../../../src/utilities");
    const user = await getValidUserById(testUser?._id);

    expect(user).toEqual(testUser?.toObject());
  });
});
