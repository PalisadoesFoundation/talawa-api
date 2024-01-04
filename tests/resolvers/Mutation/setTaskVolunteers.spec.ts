import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { TaskVolunteer } from "../../../src/models";
import type { MutationSetTaskVolunteersArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { setTaskVolunteers as setTaskVolunteersResolver } from "../../../src/resolvers/Mutation/setTaskVolunteers";
import {
  TASK_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  VOLUNTEER_NOT_FOUND_ERROR,
  VOLUNTEER_NOT_MEMBER_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";
import { wait } from "./acceptAdmin.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let randomTestUser: TestUserType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , , , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> setTaskVolunteers", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationSetTaskVolunteersArgs = {
        id: testTask!.id,
        volunteers: [],
      };

      const context = { userId: Types.ObjectId().toString() };

      const { setTaskVolunteers: setTaskVolunteersResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/setTaskVolunteers");

      await setTaskVolunteersResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationSetTaskVolunteersArgs = {
        id: Types.ObjectId().toString(),
        volunteers: [],
      };

      const context = {
        userId: testUser!.id,
      };

      const { setTaskVolunteers: setTaskVolunteersResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/setTaskVolunteers");

      await setTaskVolunteersResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TASK_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${TASK_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotAuthorizedError if task.creator !== context.userId task with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationSetTaskVolunteersArgs = {
        id: testTask!._id,
        volunteers: [],
      };

      const context = {
        userId: randomTestUser!._id,
      };

      const { setTaskVolunteers: setTaskVolunteersResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/setTaskVolunteers");

      await setTaskVolunteersResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws VolunteerNotFound error if args.volunteers has a non existent user`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationSetTaskVolunteersArgs = {
        id: testTask!._id,
        volunteers: [Types.ObjectId().toString()],
      };

      const context = {
        userId: testUser!._id,
      };

      const { setTaskVolunteers: setTaskVolunteersResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/setTaskVolunteers");

      await setTaskVolunteersResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws VolunteerNotMember error if args.volunteers has an user which is not a member of the organization under which the task is created`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationSetTaskVolunteersArgs = {
        id: testTask!._id,
        volunteers: [randomTestUser!._id],
      };

      const context = {
        userId: testUser!._id,
      };

      const { setTaskVolunteers: setTaskVolunteersResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/setTaskVolunteers");

      await setTaskVolunteersResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${VOLUNTEER_NOT_MEMBER_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${VOLUNTEER_NOT_MEMBER_ERROR.MESSAGE}`
      );
    }
  });

  it(`removes the task volunteers correctly and returns the task`, async () => {
    const args: MutationSetTaskVolunteersArgs = {
      id: testTask!._id,
      volunteers: [],
    };

    const context = { userId: testUser?._id };

    await setTaskVolunteersResolver?.({}, args, context);

    const assignedTask = await TaskVolunteer.exists({
      userId: testUser!._id,
      taskId: testTask!._id,
    });

    expect(assignedTask).toBeFalsy();
  });

  it(`adds the task volunteers correctly and returns the task`, async () => {
    const args: MutationSetTaskVolunteersArgs = {
      id: testTask!._id,
      volunteers: [testUser!._id],
    };

    const context = { userId: testUser?._id };

    await setTaskVolunteersResolver?.({}, args, context);

    const assignedTask = await TaskVolunteer.exists({
      userId: testUser!._id,
      taskId: testTask!._id,
    });

    expect(assignedTask).toBeTruthy();
  });
});
