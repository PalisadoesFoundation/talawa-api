import {
  END_DATE_VALIDATION_ERROR,
  START_DATE_VALIDATION_ERROR,
} from "../constants";
import { errors, requestContext } from "../libraries";
/**
 * This function validates the date.
 * @param startDate - starting Date
 * @param endDate - Ending Date
 */
export const validateDate = (startDate: Date, endDate: Date): void => {
  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    throw new errors.InputValidationError(
      requestContext.translate(START_DATE_VALIDATION_ERROR.MESSAGE),
      START_DATE_VALIDATION_ERROR.CODE,
      START_DATE_VALIDATION_ERROR.PARAM,
    );
  }

  //Checks if the end date is valid
  if (endDate && new Date(endDate) < new Date(startDate)) {
    throw new errors.InputValidationError(
      requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
      END_DATE_VALIDATION_ERROR.CODE,
      END_DATE_VALIDATION_ERROR.PARAM,
    );
  }
};
