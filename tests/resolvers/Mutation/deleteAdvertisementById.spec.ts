import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationDeleteAdvertisementByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { deleteAdvertisementById } from "../../../src/resolvers/Mutation/deleteAdvertisementById";
import {
  TestAdvertisementType,
  createTestAdvertisement,
} from "../../helpers/advertisement";

let testAdvertisement: TestAdvertisementType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testAdvertisement = await createTestAdvertisement();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAdvertiementById", () => {
  it(`returns false if deletion of advertisement was unsuccessful`, async () => {
    const args: MutationDeleteAdvertisementByIdArgs = {
      id: Types.ObjectId().toString(),
    };

    const deleteDonationByIdPayload = await deleteAdvertisementById?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of ads was successful`, async () => {
    const args: MutationDeleteAdvertisementByIdArgs = {
      id: testAdvertisement._id,
    };

    const deleteDonationByIdPayload = await deleteAdvertisementById?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: true,
    });
  });
});
