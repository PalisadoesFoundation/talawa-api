import "dotenv/config";
import { projects as projectsResolver } from "../../../src/resolvers/Event/projects";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import {
  createAndAssignTestTask,
  type TestEventProjectType,
} from "../../helpers/task";
import { EventProject } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testProject: TestEventProjectType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent, testProject] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> projects", () => {
  it(`returns the Event project objects for parent event`, async () => {
    const parent = testEvent!.toObject();

    const projectsPayload = await projectsResolver?.(parent, {}, {});
    const projectObject = await EventProject.find({
      _id: testProject!._id,
    }).lean();

    expect(projectsPayload!.length).toEqual(1);
    expect(projectsPayload).toEqual(projectObject);
  });
});
