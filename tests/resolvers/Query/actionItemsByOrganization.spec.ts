import "dotenv/config";
import type { InterfaceActionItem } from "../../../src/models";
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
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAssigneeUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testAssigneeUser, testEvent, testOrganization] =
    await createTestActionItems();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByOrganization", () => {
  it(`returns list of all action items associated with an organization in ascending order where eventId is not null`, async () => {
    const orderBy: ActionItemsOrderByInput = "createdAt_ASC";

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: testEvent?._id,
      orderBy,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0]).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0]._id,
      }),
    );
  });

  it(`returns list of all action items associated with an organization in ascending order where eventId is null`, async () => {
    const orderBy: ActionItemsOrderByInput = "createdAt_ASC";

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: null,
      orderBy,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0]).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0]._id,
      }),
    );
  });

  it(`returns list of all action items associated with an organization in descending order`, async () => {
    const orderBy: ActionItemsOrderByInput = "createdAt_DESC";

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: null,
      orderBy,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0]).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0]._id,
      }),
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
      is_completed: false,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: testEvent?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0]).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[1]._id,
      }),
    );
  });

  it(`returns list of all action items associated with an organization that are completed`, async () => {
    const where: ActionItemWhereInput = {
      is_completed: true,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: testEvent?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0]).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0]._id,
      }),
    );
  });

  it(`returns list of all action items matching categoryName Filter`, async () => {
    const where: ActionItemWhereInput = {
      categoryName: "Default",
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: testEvent?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0].actionItemCategory).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0].actionItemCategory,
      }),
    );
  });

  it(`returns list of all action items matching assigneeName Filter`, async () => {
    const where: ActionItemWhereInput = {
      assigneeName: testAssigneeUser?.firstName,
    };

    const args: QueryActionItemsByOrganizationArgs = {
      organizationId: testOrganization?._id,
      eventId: testEvent?._id,
      where,
    };

    const actionItemsByOrganizationPayload =
      (await actionItemsByOrganizationResolver?.(
        {},
        args,
        {},
      )) as InterfaceActionItem[];

    const actionItemsByOrganizationInfo = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
    }).lean();

    expect(actionItemsByOrganizationPayload[0].assignee).toEqual(
      expect.objectContaining({
        _id: actionItemsByOrganizationInfo[0].assignee,
      }),
    );
  });
});
