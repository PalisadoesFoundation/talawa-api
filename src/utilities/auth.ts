import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants";
import type { InterfaceAppUserProfile, InterfaceUser } from "../models";
import { Community, User } from "../models";

/**
 * Interface representing the payload of a JWT token.
 */
export interface InterfaceJwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Creates an access token (JWT) for a user that expires in 40 minutes.
 * The token contains user data and is signed with the access token secret.
 *
 * @param user - User data
 * @param appUserProfile - Application user profile data
 * @returns JSON Web Token string payload
 */
export const createAccessToken = async (
  user: InterfaceUser,
  appUserProfile: InterfaceAppUserProfile,
): Promise<string> => {
  let timeout = 30; //in minutes
  const community = await Community.findOne().lean();

  if (community) {
    timeout = community.timeout;
  }

  return jwt.sign(
    {
      tokenVersion: appUserProfile.tokenVersion,
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      timeout: timeout,
    },
    ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "40m",
    },
  );
};

/**
 * Creates a refresh token (JWT) for a user that expires in 30 days.
 * The token contains user data and is signed with the refresh token secret.
 *
 * @param user - User data
 * @param appUserProfile - Application user profile data
 * @returns JSON Web Token string payload
 */
export const createRefreshToken = (
  user: InterfaceUser,
  appUserProfile: InterfaceAppUserProfile,
): string => {
  return jwt.sign(
    {
      tokenVersion: appUserProfile?.tokenVersion,
      userId: user?._id.toString(),
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
    },
    REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: "30d",
    },
  );
};

/**
 * Revokes the refresh token for a user by removing the token from the user's profile.
 * This function searches for the user by their ID and unsets the token field in the user's document.
 *
 * @param userId - The ID of the user whose refresh token is to be revoked
 * @returns A promise that resolves when the token has been revoked
 */
export const revokeRefreshToken = async (userId: string): Promise<void> => {
  const user = await User.findOne({ _id: userId }).lean();

  if (user) {
    const filter = { _id: userId };
    const update = { $unset: { token: "" } };
    await User.findOneAndUpdate(filter, update);
  }
};
