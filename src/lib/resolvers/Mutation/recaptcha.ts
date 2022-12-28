import axios from "axios";
import { MutationResolvers } from "../../../generated/graphqlCodegen";

export const recaptcha: MutationResolvers["recaptcha"] = async (
  _parent,
  args
) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${args.data.recaptchaToken}`
  );

  return response.data.success;
};
