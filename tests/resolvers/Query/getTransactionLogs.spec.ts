import "dotenv/config";
import { getTransactionLogs as getTransactionLogsResolver } from "../../../src/resolvers/Query/getTransactionLogs";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { TransactionLog } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestTransactionLog } from "../../helpers/transactionLogs";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestTransactionLog();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getTransactionLogs", () => {
  it(`returns list of all  Transaction Logs`, async () => {
    const getPluginsPayload = await getTransactionLogsResolver?.({}, {}, {});

    const transactionLogs = await TransactionLog.find().lean();

    expect(getPluginsPayload).toEqual(transactionLogs);
  });
});
