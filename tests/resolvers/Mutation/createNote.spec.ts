import mongoose, { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  AGENDA_ITEM_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AgendaItemModel,
  AppUserProfile,
  Event,
  Organization,
  User,
} from "../../../src/models";
import type { MutationCreateNoteArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import type { TestAgendaItemType } from "../../helpers/agendaItem";
import { createNote } from "../../../src/resolvers/Mutation/createNote";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUserSuperAdmin: TestUserType;
let testAgendaItem: TestAgendaItemType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testAdminUser = await createTestUser();
  testUserSuperAdmin = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser?._id,
    admins: [testAdminUser?._id, testUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testUser?._id,
  });

  const orgId = new mongoose.Types.ObjectId();

  await AppUserProfile.updateOne(
    {
      userId: testUserSuperAdmin?._id,
    },
    {
      $set: {
        isSuperAdmin: true,
      },
    },
  );

  await AppUserProfile.updateOne(
    {
      userId: testAdminUser?._id,
    },
    {
      $set: {
        adminFor: [orgId],
      },
    },
  );

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
  });

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
    title: "title",
    description: "description",
    duration: "1 hour",
    relatedEventId: testEvent?._id,
    sequence: 1,
    organizationId: testOrganization?._id,
  });

  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createNote", () => {
  // it("creates a note agenda item", async () => {
  //   const args: MutationCreateNoteArgs = {
  //       data: {
  //           content: "Description for the note agenda item",
  //           agendaItemId : testAgendaItem._id,
  //       },
  //   };

  //   const context = {
  //     userId: testAdminUser?._id,
  //   };

  //   const { createNote: createNoteResolver } = await import(
  //     "../../../src/resolvers/Mutation/createNote"
  //   );

  //   const note = await createNoteResolver?.({}, args, context);

  //   expect(note).toBeDefined();
  //   expect(note?.content).toEqual(args.data.content);
  // });

  it("throws NotFoundError if no agenda item exists with _id === args.data.agendaItemId", async () => {
    try {
      const args: MutationCreateNoteArgs = {
        data: {
          content: "Description for the note agenda item",
          agendaItemId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?._id,
      };
      await createNote?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        AGENDA_ITEM_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("creates a note successfully", async () => {
    const args: MutationCreateNoteArgs = {
      data: {
        content: "Description for the note agenda item",
        agendaItemId: testAgendaItem._id.toString(),
      },
    };

    const context = {
      userId: testUser?._id,
    };
    const note = await createNote?.({}, args, context);

    expect(note).toBeDefined();
    expect(note?.content).toEqual(args.data.content);
    expect(note?.createdBy).toEqual(context.userId);
  });
  it("throws NotFoundError when creating an agenda item with a non-existing user", async () => {
    try {
      const args: MutationCreateNoteArgs = {
        data: {
          content: "Description for the note agenda item",
          agendaItemId: testAgendaItem._id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createNote: createNoteResolver } = await import(
        "../../../src/resolvers/Mutation/createNote"
      );

      await createNoteResolver?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      } else {
        throw new Error("An unknown error occurred.");
      }
    }
  });

  it("throws an error if currentAppUserProfile is not found", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });

    const args: MutationCreateNoteArgs = {
      data: {
        content: "Description for the note agenda item",
        agendaItemId: testAgendaItem._id,
      },
    };

    const context = {
      userId: testUser?._id,
    };
    const { createNote: createNoteResolver } = await import(
      "../../../src/resolvers/Mutation/createNote"
    );

    try {
      await createNoteResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
