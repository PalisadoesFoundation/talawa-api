import jwt from 'jsonwebtoken';
import { Interface_User } from '../models';

export interface Interface_JwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

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
      expiresIn: '15m',
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
      expiresIn: '30d',
    }
  );
};
