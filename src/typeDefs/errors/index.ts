import { commonErrors } from "./common";
import { connectionError } from "./connectionError";
import { mutationErrrors } from "./mutationErrors";

export const errors = [mutationErrrors, commonErrors, connectionError];
