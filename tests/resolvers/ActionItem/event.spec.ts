import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/ActionItem/event";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { InterfaceActionItem } from "../../../src/models";
import { ActionItem, Event } from "../../../src/models";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { TestActionItemType } from "../../helpers/actionItem";
import { createTestActionItem } from "../../helpers/actionItem";
import { nanoid } from "nanoid";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testActionItem: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization, , testActionItem] = await createTestActionItem();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> ActionItem -> event", () => {
  it(`returns the event for parent action item`, async () => {
    const testEvent = await Event.create({
      title: `title${nanoid().toLowerCase()}`,
      description: `description${nanoid().toLowerCase()}`,
      allDay: true,
      startDate: new Date(),
      recurring: true,
      isPublic: true,
      isRegisterable: true,
      creator: testUser?._id,
      admins: [testUser?._id],
      organization: testOrganization?._id,
      actionItems: [testActionItem?._id],
    });

    const updatedTestActionItem = await ActionItem.findOneAndUpdate(
      {
        _id: testActionItem?._id,
      },
      {
        eventId: testEvent?._id,
      },
      {
        new: true,
      }
    );

    const parent = updatedTestActionItem?.toObject();

    const eventByPayload = await eventResolver?.(
      parent as InterfaceActionItem,
      {},
      {}
    );

    expect(eventByPayload).toEqual(
      expect.objectContaining({
        actionItems: [updatedTestActionItem?._id],
      })
    );
  });
});
