import { Advertisement, User } from "../../src/models";
import type { InterfaceUser } from "../../src/models";

import { nanoid } from "nanoid";
import type { Document } from "mongoose";

export type TestAdvertisementType = {
  _id: string;
  name: string;
  mediaUrl: string;
  type: string;
  startDate: string;
  endDate: string;
};

// Function to create test advertisement
export const createTestAdvertisement =
  async (): Promise<TestAdvertisementType> => {
    const testAdvertisementData = {
      name: "Test Advertisement",
      mediaUrl: "https://example.com",
      type: "POPUP",
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      organizationId: "1",
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

export type TestSuperAdminType =
  | (InterfaceUser & Document<any, any, InterfaceUser>)
  | null;

export const createTestSuperAdmin = async (): Promise<TestSuperAdminType> => {
  const testSuperAdmin = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    image: null,
    appLanguageCode: "en",
    userType: "SUPERADMIN", // Set userType to "SUPERADMIN"
  });

  return testSuperAdmin;
};
