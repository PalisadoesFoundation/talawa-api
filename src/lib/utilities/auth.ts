import jwt from 'jsonwebtoken';

export interface IJwtTokenPayload {
  tokenVersion: number;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export const createAccessToken = async (user: any) => {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user.id,
      firstName: user._doc.firstName,
      lastName: user._doc.lastName,
      email: user._doc.email,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: '15m' }
  );
};

export const createRefreshToken = async (user: any) => {
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId: user.id,
      firstName: user._doc.firstName,
      lastName: user._doc.lastName,
      email: user._doc.email,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: '30d' }
  );
};
