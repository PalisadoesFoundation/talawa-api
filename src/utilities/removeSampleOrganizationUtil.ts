import {
  AppUserProfile,
  Event,
  Organization,
  Plugin,
  Post,
  SampleData,
  User,
} from "../models";

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
      AppUserProfile,
    };

    const collectionModel = collectionModels[
      collectionName
    ] as typeof Organization;
    await collectionModel.findByIdAndDelete(documentId);
  }

  await SampleData.deleteMany({});
}
