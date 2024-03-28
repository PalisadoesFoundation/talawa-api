import { nanoid } from "nanoid";
import { Venue, type InterfaceVenue } from "../../src/models";
import type { Document, Types } from "mongoose";

export type TestVenueType = InterfaceVenue &
  Document<string, Record<string, unknown>, InterfaceVenue>;

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
