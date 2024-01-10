import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "../constants";
import type { InterfaceUser } from "../models";
import { Community, User } from "../models";

export interface InterfaceJwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}
/**
 * This function creates a json web token which expires in 15 minutes.
 * It signs the given payload(user data) into a JSON Web Token string payload.
 * @param user - User data
 * @returns JSON Web Token string payload
 */
export const createAccessToken = async (
  user: InterfaceUser
): Promise<string> => {
  let timeout = 30;
  const community = await Community.findOne().lean();
  if (community) {
    timeout = community.timeout;
  }
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
      expiresIn: `${timeout}m`,
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
