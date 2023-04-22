import { Event, Task, InterfaceEvent, InterfaceTask } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

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
