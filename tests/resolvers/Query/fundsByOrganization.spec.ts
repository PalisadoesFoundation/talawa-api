import "dotenv/config";
import { Fund } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryFundsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { fundsByOrganization as fundsByOrganizationResolver } from "../../../src/resolvers/Query/fundsByOrganization";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type mongoose from "mongoose";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> fundsByOrganization", () => {
  it(`returns list of all funds associated with an organization`, async () => {
    const args: QueryFundsByOrganizationArgs = {
      organizationId: testOrganization?._id,
    };

    const fundsByOrganizationPayload = await fundsByOrganizationResolver?.(
      {},
      args,
      {},
    );

    const fundsByOrganizationInfo = await Fund.find({
      organizationId: args.organizationId,
    }).lean();

    expect(fundsByOrganizationPayload).toEqual(fundsByOrganizationInfo);
  });
});
