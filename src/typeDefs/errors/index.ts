import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { createMemberErrors } from "./createMemberErrors";
import { createAdminErrors } from "./createAdminErrors";
import { createCommentErrors } from "./createCommentErrors";

export const errors = [
  commonErrors,
  connectionError,
  createMemberErrors,
  createAdminErrors,
  createCommentErrors,
];
