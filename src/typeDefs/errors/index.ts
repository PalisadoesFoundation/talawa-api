import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { createMemberErrors } from "./createMemberErrors";
import { createAdminErrors } from "./createAdminErrors";

export const errors = [
  commonErrors,
  connectionError,
  createMemberErrors,
  createAdminErrors,
];
