import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { createMemberErrors } from "./createMemberErrors";

export const errors = [commonErrors, connectionError, createMemberErrors];
