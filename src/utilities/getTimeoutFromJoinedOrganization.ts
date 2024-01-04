import type { Types } from "mongoose";
import { Organization } from "../models";

interface InterfaceGetTimeoutFromJoinedOrganization {
  _id: Types.ObjectId;
  timeout: number | undefined | null;
}

export const getTimeoutFromJoinedOrganization = async (
  userId: Types.ObjectId
): Promise<InterfaceGetTimeoutFromJoinedOrganization[]> => {
  const organizations = await Organization.find({ members: userId })
    .select("timeout")
    .lean();

  const organizationWithTimeout: InterfaceGetTimeoutFromJoinedOrganization[] =
    organizations.map((org) => ({
      _id: org._id,
      timeout: org.timeout,
    }));

  return organizationWithTimeout;
};
