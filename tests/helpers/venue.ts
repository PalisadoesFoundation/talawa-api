import { nanoid } from "nanoid";
import { Venue, type InterfaceVenue } from "../../src/models";
import type { Document, Types } from "mongoose";

export type TestVenueType =
  | (InterfaceVenue & Document<unknown, unknown, InterfaceVenue>)
  | null;

export const createTestVenue = async (
  organizationId: Types.ObjectId,
): Promise<TestVenueType> => {
  const testVenue = await Venue.create({
    name: nanoid().toLowerCase(),
    description: nanoid().toLowerCase(),
    capacity: 5 + Math.floor(Math.random() * 100),
    organization: organizationId,
    imageUrl: null,
  });

  return testVenue as TestVenueType;
};

export const createTestVenuesForOrganization = async (
  organizationId: Types.ObjectId,
): Promise<TestVenueType[]> => {
  const testVenue1 = await Venue.create({
    name: nanoid().toLowerCase(),
    description: nanoid().toLowerCase(),
    capacity: 5 + Math.floor(Math.random() * 100),
    organization: organizationId,
    imageUrl: null,
  });

  const testVenue2 = await Venue.create({
    name: nanoid().toLowerCase(),
    description: nanoid().toLowerCase(),
    capacity: 5 + Math.floor(Math.random() * 100),
    organization: organizationId,
    imageUrl: null,
  });

  const testVenue3 = await Venue.create({
    name: nanoid().toLowerCase(),
    description: nanoid().toLowerCase(),
    capacity: 5 + Math.floor(Math.random() * 100),
    organization: organizationId,
    imageUrl: null,
  });

  return [testVenue1, testVenue2, testVenue3];
};
