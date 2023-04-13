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
  event_id: string,
  creator_id: string
): Promise<TestTaskType> => {
  const testTask = await Task.create({
    title: `title${nanoid().toLowerCase()}`,
    event: event_id,
    creator: creator_id,
  });

  await Event.updateOne(
    {
      _id: event_id,
    },
    {
      $push: {
        tasks: testTask._id,
      },
    }
  );

  return testTask;
};
