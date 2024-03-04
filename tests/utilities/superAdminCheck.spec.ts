import "dotenv/config";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { disconnect } from "../../src/db";
import {
  MONGO_DB_URL,
  USER_NOT_AUTHORIZED_SUPERADMIN,
} from "../../src/constants";
import type { TestUserType } from "../helpers/userAndOrg";
import { createTestUserFunc } from "../helpers/user";
import mongoose from "mongoose";
import { logger } from "../../src/libraries";
import { checkReplicaSet } from "../../src/utilities/checkReplicaSet";

let testUser: TestUserType;
let session: mongoose.ClientSession;

beforeAll(async () => {
  try {
    await mongoose.connect(MONGO_DB_URL as string);
    logger.info("Connected to MongoDB.");

    const replicaSet = await checkReplicaSet();
    if (replicaSet) {
      logger.info("Session started --> Connected to a replica set!");
      session = await mongoose.startSession();
      session.startTransaction();
    } else {
      logger.info("Session not started --> Not Connected to a replica set!");
    }

    testUser = await createTestUserFunc();
  } catch (error) {
    logger.error("Error while connecting to MongoDB:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  await disconnect();
});

describe("utilities -> superAdminCheck", () => {
  afterEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
  });

  it("throws error if userType===`SUPERADMIN` is false", async () => {
    const { requestContext } = await import("../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const { superAdminCheck } = await import("../../src/utilities");
      if (testUser) {
        superAdminCheck(testUser);
      }
    } catch (error: unknown) {
      if (!(error instanceof Error)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
    }
  });
});
