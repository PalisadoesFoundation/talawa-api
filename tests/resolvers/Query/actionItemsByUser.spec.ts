import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createVolunteerAndActions } from "../../helpers/volunteers";
import type { InterfaceActionItem } from "../../../src/models";
import { ActionItem } from "../../../src/models";
import type { TestActionItemType } from "../../helpers/actionItem";
import { actionItemsByUser } from "../../../src/resolvers/Query/actionItemsByUser";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser1: TestUserType;
let testActionItem1: TestActionItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [organization, , user1, , , , , actionItem1] =
    await createVolunteerAndActions();

  testOrganization = organization;
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

describe("resolvers -> Query -> actionItemsByUser", () => {
  it(`actionItemsByUser for userId, categoryName, dueDate_ASC`, async () => {
    const actionItems = (await actionItemsByUser?.(
      {},
      {
        userId: testUser1?._id.toString() ?? "testUserId",
        orderBy: "dueDate_ASC",
        where: {
          categoryName: "Test Action Item Category 1",
          orgId: testOrganization?._id.toString(),
        },
      },
      {},
    )) as unknown as InterfaceActionItem[];
    expect(actionItems[0].assigneeType).toEqual("EventVolunteer");
    expect(actionItems[1].assigneeType).toEqual("EventVolunteerGroup");
  });

  it(`actionItemsByUser for userId, assigneeName, dueDate_DESC`, async () => {
    const actionItems = (await actionItemsByUser?.(
      {},
      {
        userId: testUser1?._id.toString() ?? "testUserId",
        orderBy: "dueDate_DESC",
        where: {
          categoryName: "Test Action Item Category 1",
          assigneeName: testUser1?.firstName,
          orgId: testOrganization?._id.toString(),
        },
      },
      {},
    )) as unknown as InterfaceActionItem[];
    expect(actionItems[1].assignee.user.firstName).toEqual(
      testUser1?.firstName,
    );
  });

  it(`actionItemsByUser for userId, assigneeName doesn't match`, async () => {
    const actionItems = (await actionItemsByUser?.(
      {},
      {
        userId: testUser1?._id.toString() ?? "testUserId",
        where: {
          assigneeName: "xyz",
          orgId: testOrganization?._id.toString(),
        },
      },
      {},
    )) as unknown as InterfaceActionItem[];
    expect(actionItems.length).toEqual(0);
  });
});
