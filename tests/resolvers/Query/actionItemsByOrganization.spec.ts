import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import type { TestUserType } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceActionItem } from "../../../src/models";
import { ActionItem } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { actionItemsByOrganization } from "../../../src/resolvers/Query/actionItemsByOrganization";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testUser1: TestUserType;
let testActionItem1: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [organization, event, user1, , , , , actionItem1] =
    await createVolunteerAndActions();

  testOrganization = organization;
  testEvent = event;
  testUser1 = user1;
  testActionItem1 = actionItem1;

  await ActionItem.create({
    creator: testUser1?._id,
    assigner: testUser1?._id,
    assigneeUser: testUser1?._id,
    assigneeType: "User",
    assignee: null,
    assigneeGroup: null,
    actionItemCategory: testActionItem1.actionItemCategory,
    event: null,
    organization: testOrganization?._id,
    allottedHours: 2,
    assignmentDate: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 3000),
    isCompleted: false,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> actionItemsByOrganization", () => {
  it(`actionItemsByOrganization - organizationId, eventId, assigneeName`, async () => {
    const actionItems = (await actionItemsByOrganization?.(
      {},
      {
        organizationId: testOrganization?._id,
        eventId: testEvent?._id,
        where: {
          categoryName: "Test Action Item Category 1",
          assigneeName: testUser1?.firstName,
        },
      },
      {},
    )) as unknown as InterfaceActionItem[];
    expect(actionItems[0].assigneeType).toEqual("EventVolunteer");
    expect(actionItems[0].assignee.user.firstName).toEqual(
      testUser1?.firstName,
    );
  });

  it(`actionItemsByOrganization - organizationId, assigneeName`, async () => {
    const actionItems = (await actionItemsByOrganization?.(
      {},
      {
        organizationId: testOrganization?._id,
        where: {
          assigneeName: testUser1?.firstName,
        },
      },
      {},
    )) as unknown as InterfaceActionItem[];
    expect(actionItems[0].assigneeType).toEqual("User");
    expect(actionItems[0].assigneeUser.firstName).toEqual(testUser1?.firstName);
  });
});
