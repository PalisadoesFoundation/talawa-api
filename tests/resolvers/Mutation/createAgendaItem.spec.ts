import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, Organization, Event, EventAttendee } from "../../../src/models";
import type {
  MutationCreateAgendaItemArgs,
  MutationCreateEventArgs,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  EVENT_NOT_FOUND_ERROR,
  LENGTH_VALIDATION_ERROR,
  ORGANIZATION_NOT_AUTHORIZED_ERROR,
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testAdminUser: TestUserType;
let testOrganization: TestOrganizationType;
let testEvent: TestEventType; // Fix this line
let MONGOOSE_INSTANCE: typeof mongoose;
let testUserSuperAdmin: TestUserType;

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
    admins: [testAdminUser?._id],
    registrants: [],
    organization: testOrganization?._id,
  });

  await User.updateOne(
    {
      _id: testUser?._id,
    },
    {
      $push: {
        adminFor: testOrganization?._id,
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers -> Mutation -> createAgendaItem", () => {
  it(`throws NotFoundError if no user exists with _id === userId`, async () => {
    try {
      const args: MutationCreateAgendaItemArgs = {
        input: {
          attachments: undefined,
          categories: undefined,
          createdBy: "",
          description: undefined,
          duration: "",
          isNote: false,
          itemType: "Note",
          organization: undefined,
          relatedEvent: testEvent!._id,
          sequence: 0,
          title: "",
          urls: undefined,
          user: undefined,
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { createAgendaItem: createAgendaItemResolverError } = await import(
        "../../../src/resolvers/Mutation/createAgendaItem"
      );

      await createAgendaItemResolverError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});

// it("Should throw an error if the event is not found", async () => {
//   const args = {
//     input: {
//       attachments: undefined,
//       categories: undefined,
//       createdBy: "",
//       description: undefined,
//       duration: "",
//       isNote: false,
//       itemType: "Note",
//       organization: undefined,
//       relatedEvent:  testEvent!._id,
//       sequence: 0,
//       title: "",
//       urls: undefined,
//       user: undefined,
//     },
//   };

//   const context = {
//     userId: testUser?._id,
//   };

//   const { requestContext } = await import("../../../src/libraries");

//     const { createAgendaItem: createAgendaItemResolverError } = await import(
//       "../../../src/resolvers/Mutation/createAgendaItem"
//     );
//     try{
//     await createAgendaItemResolverError?.({}, args, context);
//   } catch (error: any) {
//     expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
//     expect(error.message).toEqual(
//       `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
//     );
//   }
// });

it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
  try {
    const args: MutationCreateAgendaItemArgs = {
      input: {
        attachments: undefined,
        categories: undefined,
        createdBy: "",
        description: undefined,
        duration: "",
        isNote: false,
        itemType: "Regular",
        organization: Types.ObjectId().toString(),
        relatedEvent: "",
        sequence: 0,
        title: "",
        urls: undefined,
        user: undefined,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createAgendaItem: createAgendaItemResolverError } = await import(
      "../../../src/resolvers/Mutation/createAgendaItem"
    );

    await createAgendaItemResolverError?.({}, args, context);
  } catch (error: any) {
    expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
  }
});
it(`throws UnauthorizedError if user with _id === context.userId is not the admin of the organization with _id === args.organizationId`, async () => {
  try {
    const args: MutationCreateAgendaItemArgs = {
      input: {
        attachments: undefined,
        categories: undefined,
        createdBy: testUser?.id,
        description: undefined,
        duration: "",
        isNote: false,
        itemType: "Regular",
        organization: testOrganization?.id,
        relatedEvent: "",
        sequence: 0,
        title: "",
        urls: undefined,
        user: undefined,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createAgendaItem: createAgendaItemResolverError } = await import(
      "../../../src/resolvers/Mutation/createAgendaItem"
    );

    await createAgendaItemResolverError?.({}, args, context);
  } catch (error: any) {
    expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
  }
});

it(`throws UnauthorizedError if user with _id === context.userId is not an event admin for the organization with _id === args.organizationId`, async () => {
  try {
    const args: MutationCreateAgendaItemArgs = {
      input: {
        attachments: undefined,
        categories: undefined,
        createdBy: testUser?.id,
        description: undefined,
        duration: "",
        isNote: false,
        itemType: "Regular",
        organization: testOrganization?.id,
        relatedEvent: testEvent!._id,
        sequence: 0,
        title: "",
        urls: undefined,
        user: undefined,
      },
    };

    const context = {
      userId: testUser?.id,
    };
    const { createAgendaItem: createAgendaItemResolverError } = await import(
      "../../../src/resolvers/Mutation/createAgendaItem"
    );

    await createAgendaItemResolverError?.({}, args, context);
  } catch (error: any) {
    expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
  }
});
