import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { acceptAdminErrors } from "../MutationError/acceptAdminErrors";
import { acceptMembershipRequestErrors } from "../MutationError/acceptMembershipRequestErrors";
import { addEventAttendeeErrors } from "../MutationError/addEventAttendeeErrors";

export const errors = [
  acceptAdminErrors,
  acceptMembershipRequestErrors,
  addEventAttendeeErrors,
  commonErrors,
  connectionError,
];
