import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { mailer } from "../../utilities";
import { ACCESS_TOKEN_SECRET } from "../../constants";
import { logger } from "../../libraries";
/**
 * This function generates otp.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns Email to the user with the otp.
 */
export const emailVerification: MutationResolvers["emailVerification"] = async (
  _parent,
  args
) => {
  const otp = (Math.floor(Math.random() * 10000) + 9999).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  const otpToken = jwt.sign(
    {
      email: args.data.email,
      otp: hashedOtp,
    },
    ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );

  const subject = "OTP for Email Verification";
  const body = `<h2>Hi,</h2><p>Your OTP: ${otp}</p> <p>Your OTP will expires in 15 minutes.</p><br><br> <small>Do not share your otp with others.</small>`;
  return mailer({
    emailTo: args.data.email,
    subject,
    body,
  }).then((info) => {
    logger.info(info);
    return { otpToken };
  });
};
