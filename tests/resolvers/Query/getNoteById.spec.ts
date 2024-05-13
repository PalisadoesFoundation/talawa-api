import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";
import {
  AgendaItemModel,
  Organization,
  Event,
  NoteModel,
} from "../../../src/models";
import { NOTE_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { getNoteById } from "../../../src/resolvers/Query/getNoteById";
import type { TestNoteType } from "../../helpers/note";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let testAgendaItem: TestAgendaItemType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testNote: TestNoteType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    creatorId: testUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
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
    creatorId: testUser?._id,
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
  });
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
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getNoteById", () => {
  it("throws NotFoundError if no note exists with the given ID", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };

      await getNoteById?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(NOTE_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("returns the note successfully if the user is authorized", async () => {
    const args = {
      id: testNote._id.toString(),
    };

    const result = await getNoteById?.({}, args, {});

    expect(result).toBeDefined();
    expect(result?._id).toEqual(testNote._id);
  });
});
