import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Fund } from "../../../src/models";
import { funds as fundResolvers } from "../../../src/resolvers/Organization/funds";
import { createTestFund } from "../../helpers/Fund";
import { connect, disconnect } from "../../helpers/db";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;

let testOrganization: TestOrganizationType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFund();
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Organization->funds", () => {
  it("returns  the  parent fund for  campaign", async () => {
    const parent = testOrganization;
    if (parent) {
      const fundPayload = await fundResolvers?.(parent, {}, {});
      const funds = await Fund.find({
        organizationId: testOrganization?._id,
      }).lean();

      expect(fundPayload).toMatchObject(funds);
    }
  });
});
