import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getFundById } from "../../../src/resolvers/Query/getFundById";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;
let testFund: TestFundType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestFund();
  testFund = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Query->getFundById", () => {
  it(`returns the fund with _id === args.id`, async () => {
    const args = {
      id: testFund?._id,
    };
    const getFundByIdPayload = await getFundById?.({}, args, {});
    expect(getFundByIdPayload).toEqual(testFund?.toObject());
  });
  it(`returns null if fund not found for args.id`, async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };
    const getFundByIdPayload = await getFundById?.({}, args, {});
    expect(getFundByIdPayload).toEqual({});
  });
});
