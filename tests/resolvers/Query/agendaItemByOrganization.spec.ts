import "dotenv/config";
import { AgendaItemModel } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryAgendaItemByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { agendaItemByOrganization } from "../../../src/resolvers/Query/agendaItemByOrganization";
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

describe("resolvers -> Query -> agendaItemByOrganization", () => {
  it(`returns list of all items belonging to an organization`, async () => {
    const args: QueryAgendaItemByOrganizationArgs = {
      organizationId: testOrganization?._id,
    };

    const itemByOrganizationPayload = await agendaItemByOrganization?.(
      {},
      args,
      {},
    );

    const itemByOrganizationInfo = await AgendaItemModel.find({
      organizationId: testOrganization?._id,
    }).lean();

    expect(itemByOrganizationPayload).toEqual(itemByOrganizationInfo);
  });
});
