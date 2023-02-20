import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { logout as logoutResolver } from "../../../src/resolvers/Mutation/logout";
import { USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> logout", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };
      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
        };
      });
      const { logout: logoutResolver } = await import(
        "../../../src/resolvers/Mutation/logout"
      );

      await logoutResolver?.({}, {}, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`sets token === null for user with _id === context.userId and returns true`, async () => {
    const context = {
      userId: testUser!.id,
    };

    const logoutPayload = await logoutResolver?.({}, {}, context);

    expect(logoutPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["token"])
      .lean();

    expect(updatedTestUser!.token).toEqual(null);
  });
});
