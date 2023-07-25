import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { acceptAdminErrors } from "../MutationError/acceptAdminErrors";
import { acceptMembershipRequestErrors } from "../MutationError/acceptMembershipRequestErrors";

export const errors = [
  acceptAdminErrors,
  acceptMembershipRequestErrors,
  commonErrors,
  connectionError,
];
