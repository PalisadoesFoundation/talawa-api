import axios from "axios";
import { RECAPTCHA_SECRET_KEY } from "../../constants";
import { MutationResolvers } from "../../types/generatedGraphQLTypes";

export const recaptcha: MutationResolvers["recaptcha"] = async (
  _parent,
  args
) => {
  const response = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${args.data.recaptchaToken}`
  );

  return response.data.success;
};
