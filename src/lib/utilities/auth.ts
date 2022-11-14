import jwt from "jsonwebtoken";
import { Interface_User } from "../models";

export interface Interface_JwtTokenPayload {
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
export const createAccessToken = async (user: Interface_User) => {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

export const createRefreshToken = async (user: Interface_User) => {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "30d",
    }
  );
};
