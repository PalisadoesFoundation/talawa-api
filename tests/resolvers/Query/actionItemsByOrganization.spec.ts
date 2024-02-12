import "dotenv/config";
import { ActionItem, ActionItemCategory } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { QueryActionItemsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { actionItemsByOrganization as actionItemsByOrganizationResolver } from "../../../src/resolvers/Query/actionItemsByOrganization";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type mongoose from "mongoose";
import { createTestActionItems } from "../../helpers/actionItem";
import type { TestEventType } from "../../helpers/events";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testEvent, testOrganization] = await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByOrganization", () => {
  it(`returns list of all action items associated with an organization`, async () => {
    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
    };

    // Use testEvent within the test
    console.log(testEvent);

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo
    );
  });
});
