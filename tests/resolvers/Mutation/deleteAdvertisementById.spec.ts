import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceAdvertisement } from "../../../src/models";
import { Advertisement } from "../../../src/models";
import type { MutationDeleteAdvertisementByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { deleteAdvertisementById } from "../../../src/resolvers/Mutation/deleteAdvertisementById";

let testAdvertisement: InterfaceAdvertisement &
  Document<any, any, InterfaceAdvertisement>;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  const testOrganization = temp[1];
  testAdvertisement = await Advertisement.create({
    organizationId: testOrganization?._id,
    endDate: new Date(),
    startDate: new Date(),
    type: "POPUP",
    name: "Cookies at just $5 for a packet",
    mediaUrl: "data:image/png;base64,bWVkaWEgY29udGVudA==",
    creatorId: temp[0]?._id,
  });
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
