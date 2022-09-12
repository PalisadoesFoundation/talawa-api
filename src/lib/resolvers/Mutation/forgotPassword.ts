import bcrypt from 'bcryptjs';
import jwtDecode from 'jwt-decode';
import { MutationResolvers } from '../../../generated/graphQLTypescriptTypes';
import { User } from '../../models';
import { INVALID_OTP } from '../../../constants';

export const forgotPassword: MutationResolvers['forgotPassword'] = async (
  _parent,
  args
) => {
  const { userOtp, newPassword, otpToken } = args.data;

  // Extracts email and otp out of otpToken.
  const { email, otp } = jwtDecode<{
    email: string;
    otp: string;
  }>(otpToken);

  // Compares otpToken and otp.
  const otpIsValid = await bcrypt.compare(userOtp, otp);

  // Checks whether otp is valid.
  if (otpIsValid === false) {
    throw new Error(INVALID_OTP);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Updates password field for user's document with email === email.
  await User.updateOne(
    {
      email,
    },
    {
      password: hashedPassword,
    }
  );

  // Returns true if operation is successful.
  return true;
};
