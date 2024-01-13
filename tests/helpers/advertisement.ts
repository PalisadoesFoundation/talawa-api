import { Advertisement } from "../../src/models";

export type TestAdvertisementType = {
  _id: string;
  name: string;
  link: string;
  type: string;
  startDate: string;
  endDate: string;
};

// Function to create test advertisement
export const createTestAdvertisement =
  async (): Promise<TestAdvertisementType> => {
    const testAdvertisementData = {
      name: "Test Advertisement",
      link: "https://example.com",
      type: "POPUP",
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      orgId: "1",
      createdAt: "2024-01-13T18:23:00.316Z",
      updatedAt: "2024-01-13T20:28:21.292Z",
      creatorId: "656f1bc5dd9d1d4c5849234a",
    };

    // Create test advertisement in the database
    const createdAdvertisement = await Advertisement.create(
      testAdvertisementData
    );

    return createdAdvertisement.toObject();
  };
