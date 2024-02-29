import { User, Organization, Post, Event, Plugin, SampleData } from "../models";
import type { Model } from "mongoose";

export async function removeSampleOrganization(): Promise<void> {
  const sampleDataDocuments = await SampleData.find({});

  for (const document of sampleDataDocuments) {
    const { collectionName, documentId } = document;
    const collectionModels = {
      Organization,
      Post,
      Event,
      User,
      Plugin,
    };

    const collectionModel = collectionModels[collectionName] as Model<any>;
    await collectionModel.findByIdAndDelete(documentId);
  }

  await SampleData.deleteMany({});
}
