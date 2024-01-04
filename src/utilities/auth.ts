// External module imports
import jwt from "jsonwebtoken";

// Absolute imports
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants";

// Relative imports
import type { InterfaceUser } from "../models";
import { User } from "../models";
import { getTimeoutFromJoinedOrganization } from "./getTimeoutFromJoinedOrganization";

export interface InterfaceJwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * This function creates a JSON Web Token (JWT) which expires in a time specified by the maximum timeout value
 * among the organizations the user has joined. If the user has not joined any organizations, or if none of the
 * organizations have a timeout value, a default expiration time of 30 minutes is used. The expiration time is
 * also constrained to be within a range of 15 to 60 minutes.
 *
 * The JWT is signed with the user's data as the payload.
 *
 * @param user - The user for whom to create the JWT. The user's data will be included in the JWT payload.
 * @returns A promise that resolves to the JWT string.
 */

export const createAccessToken = async (
  user: InterfaceUser
): Promise<string> => {
  const organizations = await getTimeoutFromJoinedOrganization(user._id);

  let maxTimeout = 30;

  // If organizations is not null, find the maximum timeout
  if (organizations) {
    maxTimeout = organizations.reduce(
      (max, org) => (org.timeout ? Math.max(max, org.timeout) : max),
      30
    );
  }

  // Calculate the expiration time, ensuring it's within the specified range
  const expirationTime = Math.max(Math.min(maxTimeout, 60), 15);

  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: `${expirationTime}m`,
    }
  );
};

export const createRefreshToken = (user: InterfaceUser): string => {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "30d",
    }
  );
};

export const revokeRefreshToken = async (userId: string): Promise<void> => {
  const user = await User.findOne({ _id: userId }).lean();

  if (user) {
    const filter = { _id: userId };
    const update = { $unset: { token: "" } };
    await User.findOneAndUpdate(filter, update);
  }
};
