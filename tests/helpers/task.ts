import { Event, Task, Interface_Event, Interface_Task } from "../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";

export type testEventType =
  | (Interface_Event & Document<any, any, Interface_Event>)
  | null;

export type testTaskType = 
  | (Interface_Task & Document<any, any, Interface_Task>)
  | null;

export const createTestTask = async (
    event_id: string,
    creator_id: string,
): Promise<testTaskType> => {
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
}