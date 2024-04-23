import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  NOTE_NOT_FOUND_ERROR,
  UNAUTHORIZED_REMOVE_NOTE_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AgendaItemModel,
  AppUserProfile,
  NoteModel,
  Organization,
  User,
} from "../../../src/models";
import { deleteNote } from "../../../src/resolvers/Mutation/deleteNote";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { connect, disconnect } from "../../helpers/db";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { MutationDeleteNoteArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestNoteType } from "../../helpers/note";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testAgendaItem: TestAgendaItemType;
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
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });
  const temp = await createTestEvent();
  testEvent = temp[2];
  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    },
  );
  testAgendaItem = await AgendaItemModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    title: "Test Item",
    duration: "One hour",
    relatedEvent: testEvent?._id,
    sequence: 1,
    itemType: "Regular",
    isNote: false,
  });

  await User.updateOne(
    {
      _id: testAdminUser?._id,
    },
    {
      $push: {
        createdAgendaItems: [testAgendaItem],
      },
    },
  );
  testNote = (await NoteModel.create({
    createdBy: testAdminUser?._id,
    updatedBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    content: "Test Note Content",
    agendaItemId: testAgendaItem?._id,
  })) as unknown as TestNoteType;
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message: unknown) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteNote", () => {
  it("throws unknown error if no user exists with _id === userId", async () => {
    try {
      const args: MutationDeleteNoteArgs = { id: testNote?._id.toString() };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await deleteNote?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });
  it("throws NotFoundError if the note is not found", async () => {
    try {
      const args: MutationDeleteNoteArgs = {
        id: new Types.ObjectId().toString(),
      };
      const context = { userId: testUser?._id.toString() };

      await deleteNote?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(NOTE_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });
  it("throws UnauthorizedError if the user is not the creator of the note", async () => {
    try {
      const otherUser = await createTestUser(); // Create another user
      const args: MutationDeleteNoteArgs = { id: testNote?._id.toString() };
      const context = { userId: otherUser?._id.toString() };

      await deleteNote?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(UNAUTHORIZED_REMOVE_NOTE_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });
  it("deletes the note if the user is the creator", async () => {
    const args: MutationDeleteNoteArgs = { id: testNote?._id.toString() };
    const context = { userId: testAdminUser?._id.toString() };

    const result = await deleteNote?.({}, args, context);
    expect(result).toEqual(testNote?._id.toString());
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testAdminUser?._id,
    });
    const args: MutationDeleteNoteArgs = {
      id: testNote?._id.toString(),
    };
    const context = {
      userId: testAdminUser?._id,
    };

    try {
      if (deleteNote) await deleteNote({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
