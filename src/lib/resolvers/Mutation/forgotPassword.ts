import bcrypt from "bcryptjs";
import jwtDecode from "jwt-decode";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import { INVALID_OTP } from "../../../constants";
/**
 * This function enables a user to restore password.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @remarks The following tasks are done:
 * 1. Extracts email and otp out of otpToken.
 * 2. Compares otpToken and otp.
 * 3. Checks whether otp is valid.
 * 4. Updates password field for user's document with email === email.
 * @returns True if the operation is successful.
 */
export const forgotPassword: MutationResolvers["forgotPassword"] = async (
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
