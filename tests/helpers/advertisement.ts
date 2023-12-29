import { Advertisement } from "../../src/models";

type AdvertisementTypes = {
  type: "POPUP" | "MENU" | "BANNER";
};

export type TestAdvertisementType = {
  _id: string;
  name: string;
  link: string;
  type: AdvertisementTypes;
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
    };

    // Create test advertisement in the database
    const createdAdvertisement = await Advertisement.create(
      testAdvertisementData
    );

    return createdAdvertisement.toObject();
  };
