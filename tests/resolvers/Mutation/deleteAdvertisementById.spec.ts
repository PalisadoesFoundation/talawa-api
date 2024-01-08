import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  InterfaceAdvertisement,
  InterfaceDonation,
} from "../../../src/models";
import { Advertisement } from "../../../src/models";
import type { MutationDeleteDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { deleteAdvertisementById } from "../../../src/resolvers/Mutation/deleteAdvertisementById";

let testAdvertisement: InterfaceAdvertisement &
  Document<any, any, InterfaceDonation>;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  const testOrganization = temp[1];
  testAdvertisement = await Advertisement.create({
    orgId: testOrganization?._id,
    endDate: new Date(),
    mediaUrl: "data:image/png;base64,bWVkaWEgY29udGVudA==",
    startDate: new Date(),
    type: "POPUP",
    name: "Cookies at just $5 for a packet",
    file: "data:image/png;base64,bWVkaWEgY29udGVudA==",
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAdvertiementById", () => {
  it(`returns false if deletion of advertisement was unsuccessful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
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
    const args: MutationDeleteDonationByIdArgs = {
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
