import type { Model, Document } from "mongoose";
import { Schema, model, models } from "mongoose";
import { createLoggingMiddleware } from "../libraries/dbLogger";

export interface InterfaceSampleData extends Document {
  documentId: string;
  collectionName:
    | "Organization"
    | "Post"
    | "Event"
    | "User"
    | "Plugin"
    | "AppUserProfile";
}

const sampleDataSchema = new Schema<InterfaceSampleData>({
  documentId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
    enum: ["Organization", "Post", "Event", "User", "AppUserProfile", "Plugin"],
  },
});

createLoggingMiddleware<InterfaceSampleData>(sampleDataSchema, "SampleData");

const sampleDataModel = (): Model<InterfaceSampleData> =>
  model<InterfaceSampleData>("SampleData", sampleDataSchema);

export const SampleData = (models.SampleData ||
  sampleDataModel()) as ReturnType<typeof sampleDataModel>;
