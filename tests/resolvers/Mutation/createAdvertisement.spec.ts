import "dotenv/config";
import type mongoose from "mongoose";
import type {
  MutationCreateAdvertisementArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import {
  createTestUserAndOrganization,
  createTestUser,
} from "../../helpers/userAndOrg";
import { wait } from "./acceptAdmin.spec";
import { TRANSACTION_LOG_TYPES } from "../../../src/constants";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";
let testUser: TestUserType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let randomUser: TestUserType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  randomUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`should create the ad and returns `, async () => {
    const args: MutationCreateAdvertisementArgs = {
      name: "myad",
      orgId: "64d1f8cb77a4b61004f824b8",
      type: "POPUP",
      link: "https://www.example.com",
      startDate: "2023-10-08T13:02:29.000Z",
      endDate: "2023-10-08T13:02:29.000Z",
    };

    const context = {
      userId: testUser?.id,
    };

    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );

    const createdAdvertisementPayload = await createAdvertisementResolver?.(
      {},
      args,
      context
    );

    expect(createdAdvertisementPayload).toHaveProperty("name", "myad");

    expect(createdAdvertisementPayload).toHaveProperty(
      "link",
      "https://www.example.com"
    );

    expect(createdAdvertisementPayload).toHaveProperty("type", "POPUP");

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "Advertisement",
    });
  });
});
