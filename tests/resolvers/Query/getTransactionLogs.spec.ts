import "dotenv/config";
import { getTransactionLogs as getTransactionLogsResolver } from "../../../src/resolvers/Query/getTransactionLogs";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TRANSACTION_LOG_PATH } from "../../../src/constants";
import * as fs from "fs";
import type { TransactionLog } from "../../../src/types/generatedGraphQLTypes";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const timestamp = new Date().toISOString();
  const testLogMessage = `timestamp=${timestamp}, createdBy=test, type=CREATE, model=User, message=test message`;
  fs.writeFileSync(TRANSACTION_LOG_PATH as string, "");
  fs.writeFileSync(TRANSACTION_LOG_PATH as string, testLogMessage);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getTransactionLogs", () => {
  it(`returns list of all  Transaction Logs`, async () => {
    const transactions = getTransactionLogsResolver!({}, {}, {})!;

    expect((transactions as TransactionLog[])[0]).toEqual({
      createdBy: "test",
      type: "CREATE",
      timestamp: expect.anything(),
      model: "User",
      message: "test message",
    });
  });
});
