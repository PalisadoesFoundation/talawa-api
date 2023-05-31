import type { InterfaceEvent, InterfaceTask } from "../../src/models";
import { Event, Task, TaskVolunteer } from "../../src/models";
import type { Document } from "mongoose";
import { nanoid } from "nanoid";
import { createTestEvent } from "./events";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";

export type TestEventType =
  | (InterfaceEvent & Document<any, any, InterfaceEvent>)
  | null;

export type TestTaskType =
  | (InterfaceTask & Document<any, any, InterfaceTask>)
  | null;

export const createTestTask = async (
  eventId: string,
  creatorId: string
): Promise<TestTaskType> => {
  const testTask = await Task.create({
    title: `title${nanoid().toLowerCase()}`,
    event: eventId,
    creator: creatorId,
  });

  await Event.updateOne(
    {
      _id: eventId,
    },
    {
      $push: {
        tasks: testTask._id,
      },
    }
  );

  return testTask;
};

export const createAndAssignTestTask = async (): Promise<
  [TestUserType, TestOrganizationType, TestEventType, TestTaskType]
> => {
  const [testUser, testOrg, testEvent] = await createTestEvent();
  const testTask = await createTestTask(testEvent!._id, testUser!._id);

  // Assign the task to the user
  await TaskVolunteer.create({ userId: testUser!._id, taskId: testTask!._id });

  return [testUser, testOrg, testEvent, testTask];
};
