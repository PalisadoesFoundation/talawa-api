import "dotenv/config";
import { ActionItem, ActionItemCategory } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type {
  ActionItemWhereInput,
  ActionItemsOrderByInput,
  QueryActionItemsByOrganizationArgs,
} from "../../../src/types/generatedGraphQLTypes";
import { actionItemsByOrganization as actionItemsByOrganizationResolver } from "../../../src/resolvers/Query/actionItemsByOrganization";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type mongoose from "mongoose";
import { createTestActionItems } from "../../helpers/actionItem";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testEvent, testOrganization] = await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByOrganization", () => {
  it(`returns list of all action items associated with an organization in ascending order`, async () => {
    const orderBy: ActionItemsOrderByInput = "createdAt_ASC";

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      orderBy,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });

  it(`returns list of all action items associated with an organization in descending order`, async () => {
    const orderBy: ActionItemsOrderByInput = "createdAt_DESC";

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      orderBy,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    actionItemsByOrganizationPayload?.reverse();

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });

  it(`returns list of all action items associated with an organization and belonging to an action item category`, async () => {
    const actionItemCategories = await ActionItemCategory.find({
      organizationId: testOrganization?._id,
    });

    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemCategoryId = actionItemCategoriesIds[0];

    const where: ActionItemWhereInput = {
      actionItemCategory_id: actionItemCategoryId.toString(),
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId,
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });
  it(`returns list of all action items associated with an organization that are active`, async () => {
    const where: ActionItemWhereInput = {
      is_active: true,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
      isCompleted: false,
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });

  it(`returns list of all action items associated with an organization that are completed`, async () => {
    const where: ActionItemWhereInput = {
      is_completed: true,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
      isCompleted: true,
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });

  it(`returns list of all action items associated with an organization and belonging to an event`, async () => {
    const where: ActionItemWhereInput = {
      event_id: testEvent?._id,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemCategories = await ActionItemCategory.find({
      organizationId: args.organizationId,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId: { $in: actionItemCategoriesIds },
      eventId: testEvent?._id,
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });

  it(`returns list of all action items associated with an organization and belonging to an event and a specific category and are completed`, async () => {
    const actionItemCategories = await ActionItemCategory.find({
      organizationId: testOrganization?._id,
    });
    const actionItemCategoriesIds = actionItemCategories.map(
      (category) => category._id,
    );

    const actionItemCategoryId = actionItemCategoriesIds[0];

    const where: ActionItemWhereInput = {
      actionItemCategory_id: actionItemCategoryId.toString(),
      event_id: testEvent?._id,
      is_completed: true,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      await actionItemsByOrganizationResolver?.({}, args, {});

    const actionItemsByOrganizationInfo = await ActionItem.find({
      actionItemCategoryId,
      eventId: testEvent?._id,
      isCompleted: true,
    }).lean();

    expect(actionItemsByOrganizationPayload).toEqual(
      actionItemsByOrganizationInfo,
    );
  });
});
