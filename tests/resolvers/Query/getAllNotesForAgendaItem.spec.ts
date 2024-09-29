import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  AgendaItemModel,
  NoteModel,
  Organization,
  Event,
} from "../../../src/models";
import { getAllNotesForAgendaItem } from "../../../src/resolvers/Query/getAllNotesForAgendaItem";
import { connect, disconnect } from "../../helpers/db";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestUserType } from "../../helpers/user";
import type { TestNoteType } from "../../helpers/note";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAgendaItem: TestAgendaItemType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAdminUser: TestUserType;
let testNote: TestNoteType;
let testNote2: TestNoteType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });
  testEvent = await Event.create({
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date(),
    recurring: true,
    isPublic: true,
    isRegisterable: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
    creatorId: testUser?._id,
  }); //Comment

  testAgendaItem = await AgendaItemModel.create({
    title: "Test Agenda Item",
    description: "This is a test agenda item",
    duration: "2 hours",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attachments: ["attachment1", "attachment2"],
    relatedEvent: testEvent?._id,
    createdBy: testAdminUser?._id,
    urls: ["url1", "url2"],
    user: "testuser",
    categories: [],
    sequence: 1,
    itemType: "Regular",
    organization: testOrganization?._id,
    isNote: false,
  });
  testNote = (await NoteModel.create({
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    content: "Test Note Content",
    agendaItemId: testAgendaItem?._id,
  })) as unknown as TestNoteType;
  testNote2 = (await NoteModel.create({
    content: "Test Note 2",
    agendaItemId: testAgendaItem?._id,
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  })) as unknown as TestNoteType;
  console.log(testNote);
  console.log(testNote2);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getAllNotesForAgendaItem", () => {
  it("returns an empty array if no notes exist for the provided agendaItemId", async () => {
    const args = {
      agendaItemId: new Types.ObjectId().toString(),
    };
    const notes = await getAllNotesForAgendaItem?.({}, args, {});
    expect(notes).toEqual([]);
  });

  it("returns all notes for the provided agendaItemId", async () => {
    const args = {
      agendaItemId: testAgendaItem?._id,
    };
    const notes = await getAllNotesForAgendaItem?.({}, args, {});
    expect(notes?.length).toEqual(2);
  });
});
