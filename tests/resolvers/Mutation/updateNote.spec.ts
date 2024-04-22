import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  NOTE_NOT_FOUND_ERROR,
  UNAUTHORIZED_UPDATE_NOTE_ERROR,
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
import type { MutationUpdateNoteArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testOrganization: TestOrganizationType;
let testAgendaItem: TestAgendaItemType;
let testAgendaItem2: TestAgendaItemType;
let testNote: TestNoteType;

import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { updateNote } from "../../../src/resolvers/Mutation/updateNote";
import type { TestNoteType } from "../../helpers/note";

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
  const temp = await createTestEvent();
  testEvent = temp[2];
  await AppUserProfile.updateOne(
    {
      userId: testUser?._id,
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
  testAgendaItem2 = await AgendaItemModel.create({
    createdBy: testAdminUser?._id,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    title: "Test Item2",
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
        createdAgendaItems: [testAgendaItem, testAgendaItem2],
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

describe("resolvers -> Mutation -> updateNote", () => {
  it("throws NotFoundError if no user exists with _id === userID", async () => {
    try {
      const args: MutationUpdateNoteArgs = {
        id: "",
        data: {
          updatedBy: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await updateNote?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no note  exists with _id === args.id", async () => {
    try {
      const args: MutationUpdateNoteArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          updatedBy: testAdminUser?._id,
        },
      };

      const context = {
        userId: testAdminUser?._id,
      };
      await updateNote?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(NOTE_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws UnauthorizedError if user is not the creator of the note", async () => {
    try {
      const args: MutationUpdateNoteArgs = {
        id: testNote?._id.toString(),
        data: {
          updatedBy: testUser?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await updateNote?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        UNAUTHORIZED_UPDATE_NOTE_ERROR.MESSAGE,
      );
    }
  });

  it("updates the  note successfully", async () => {
    const args: MutationUpdateNoteArgs = {
      id: testNote._id.toString(),
      data: {
        updatedBy: testAdminUser?._id,
        content: "Updated Content",
      },
    };

    const context = {
      userId: testAdminUser?._id,
    };

    const updateNotePayload = await updateNote?.({}, args, context);

    const testUpdateNotePayload = await NoteModel.findOne({
      _id: testNote?._id,
    }).lean();

    expect(updateNotePayload).toEqual(testUpdateNotePayload);
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationUpdateNoteArgs = {
      id: testNote._id.toString(),
      data: {
        updatedBy: testAdminUser?._id,
        content: "Updated Content",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    try {
      await updateNote?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
