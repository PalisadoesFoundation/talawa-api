import type { Document, PopulatedDoc } from "mongoose";
import { nanoid } from "nanoid";
import type { InterfaceAdvertisement, InterfaceUser } from "../../src/models";
import { Advertisement, AppUserProfile, User } from "../../src/models";
import { createTestUserAndOrganization } from "./userAndOrg";

export type TestAdvertisementType = {
  _id: string;
  organizationId: PopulatedDoc<InterfaceAdvertisement & Document>;
  name: string;
  mediaUrl: string;
  creatorId: PopulatedDoc<InterfaceUser & Document>;
  type: "POPUP" | "MENU" | "BANNER";
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
};

// Function to create test advertisement
export const createTestAdvertisement =
  async (): Promise<TestAdvertisementType> => {
    const [testUser, testOrganization] = await createTestUserAndOrganization();

    // Create test advertisement in the database
    const createdAdvertisement = await Advertisement.create({
      name: "Test Advertisement",
      mediaUrl: "data:image/png;base64,bWVkaWEgY29udG",
      type: "POPUP",
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      organizationId: testOrganization?._id,
      createdAt: "2024-01-13T18:23:00.316Z",
      updatedAt: "2024-01-13T20:28:21.292Z",
      creatorId: testUser?._id,
    });

    return createdAdvertisement.toObject();
  };
export type TestSuperAdminType =
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  (InterfaceUser & Document<any, any, InterfaceUser>) | null;

export const createTestSuperAdmin = async (): Promise<TestSuperAdminType> => {
  const testSuperAdmin = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: `pass${nanoid().toLowerCase()}`,
    firstName: `firstName${nanoid().toLowerCase()}`,
    lastName: `lastName${nanoid().toLowerCase()}`,
    image: null,
  });
  await AppUserProfile.create({
    userId: testSuperAdmin._id,
    isSuperAdmin: true,
  });

  return testSuperAdmin;
};
