import type { Model } from "mongoose";
import { Schema, model, models } from "mongoose";

export interface InterfaceSampleData {
  documentId: string;
  collectionName: "Organization" | "Post" | "Event" | "User" | "Plugin";
}

const sampleDataSchema = new Schema<InterfaceSampleData>({
  documentId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
    enum: ["Organization", "Post", "Event", "User", "Plugin"],
  },
});

const sampleDataModel = (): Model<InterfaceSampleData> =>
  model<InterfaceSampleData>("SampleData", sampleDataSchema);

export const SampleData = (models.SampleData ||
  sampleDataModel()) as ReturnType<typeof sampleDataModel>;
