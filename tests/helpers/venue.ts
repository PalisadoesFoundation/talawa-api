import { nanoid } from "nanoid";
import { Venue, type InterfaceVenue } from "../../src/models";
import type { Document } from "mongoose";
import { Types } from "mongoose";

export type TestVenueType =
  | (InterfaceVenue & Document<any, any, InterfaceVenue>)
  | null;

export const createTestVenue = async (
  organizationId: Types.ObjectId,
): Promise<TestVenueType> => {
  const testVenue = await Venue.create({
    name: nanoid().toLowerCase(),
    description: nanoid().toLowerCase(),
    capacity: 5 + Math.floor(Math.random() * 100),
    organizationId,
    imageUrl: null,
  });
  return testVenue;
};
