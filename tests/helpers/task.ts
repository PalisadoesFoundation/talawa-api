import type {
  InterfaceEvent,
  InterfaceEventProject,
  InterfaceTask,
} from "../../src/models";
import { EventProject, Task, TaskVolunteer } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { createTestEvent } from "./events";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export type TestEventProjectType =
  | (InterfaceEventProject & Document<any, any, InterfaceEventProject>)
  | null;

export type TestTaskType =
  | (InterfaceTask & Document<any, any, InterfaceTask>)
  | null;

export const createTestEventProject = async (): Promise<
  [TestUserType, TestOrganizationType, TestEventType, TestEventProjectType]
> => {
  const [testUser, testOrg, testEvent] = await createTestEvent();
  const testEventProject = await EventProject.create({
    title: `test${nanoid()}`,
    description: `testDesc${nanoid()}`,
    event: testEvent!._id,
    creator: testUser!._id,
  });

  return [testUser, testOrg, testEvent, testEventProject];
};

export const createAndAssignTestTask = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestEventType,
    TestEventProjectType,
    TestTaskType
  ]
> => {
  const [testUser, testOrg, testEvent, testEventProject] =
    await createTestEventProject();

  const testTask = await Task.create({
    title: `test${nanoid()}`,
    description: `testDesc${nanoid()}`,
    creator: testUser!._id,
    eventProjectId: testEventProject!._id,
  });

  // Assign the task to the user
  await TaskVolunteer.create({ userId: testUser!._id, taskId: testTask!._id });

  return [testUser, testOrg, testEvent, testEventProject, testTask];
};

export const createTestTask = async (
  eventID: string,
  userID: string
): Promise<[TestEventProjectType, TestTaskType]> => {
  const testEventProject = await EventProject.create({
    title: `test${nanoid()}`,
    description: `testDesc${nanoid()}`,
    event: eventID,
    creator: userID,
  });

  const testTask = await Task.create({
    title: `test${nanoid()}`,
    description: `testDesc${nanoid()}`,
    creator: userID,
    eventProjectId: testEventProject!._id,
  });

  // Assign the task to the user
  await TaskVolunteer.create({ userId: userID, taskId: testTask!._id });

  return [testEventProject, testTask];
};
