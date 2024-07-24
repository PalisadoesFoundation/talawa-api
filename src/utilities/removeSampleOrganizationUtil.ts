import {
  AppUserProfile,
  Event,
  Organization,
  Plugin,
  Post,
  SampleData,
  User,
} from "../models";

/**
 * Removes sample organization data from respective collections based on entries in SampleData collection.
 * Also deletes all documents in SampleData collection after removal.
 * @returns Promise<void>
 */
export async function removeSampleOrganization(): Promise<void> {
  // Retrieve all documents from SampleData collection
  const sampleDataDocuments = await SampleData.find({});

  // Iterate through each document in SampleData
  for (const document of sampleDataDocuments) {
    const { collectionName, documentId } = document;

    // Define a mapping of collection names to their respective Mongoose models
    const collectionModels = {
      Organization,
      Post,
      Event,
      User,
      Plugin,
      AppUserProfile,
    };

    // Determine the model based on collectionName retrieved from SampleData
    const collectionModel = collectionModels[
      collectionName
    ] as typeof Organization;
    // Safely cast the model to its appropriate type and delete the document by ID
    await collectionModel.findByIdAndDelete(documentId);
  }

  // Delete all documents from SampleData collection after cleanup
  await SampleData.deleteMany({});
}
