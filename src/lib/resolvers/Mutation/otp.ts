import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { MutationResolvers } from "../../../generated/graphqlCodegen";
import { User } from "../../models";
import { mailer } from "../../utilities";
import { USER_NOT_FOUND } from "../../../constants";
/**
 * This function generates otp.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @remarks The following checks are done:
 * 1. If the user exists
 * @returns Email to the user with the otp.
 */
export const otp: MutationResolvers["otp"] = async (_parent, args) => {
  const user = await User.findOne({
    email: args.data.email,
  }).lean();

  if (!user) {
    throw new Error(USER_NOT_FOUND);
  }

  const username = `${user.firstName} ${user.lastName}`;

  const otp = (Math.floor(Math.random() * 10000) + 9999).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  const otpToken = jwt.sign(
    {
      email: args.data.email,
      otp: hashedOtp,
    },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );

  const subject = "OTP for Talawa-admin forgot password";
  const body = `<h2>Hi, ${username}</h2><p>Your OTP: ${otp}</p> <p>Your OTP will expires in 5 minutes.</p><br><br> <small>Do not share your otp with others.</small>`;

  return mailer({
    emailTo: args.data.email,
    subject,
    body,
  }).then((info) => {
    console.log(info);
    return { otpToken };
  });
};
