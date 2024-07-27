import {
  END_DATE_VALIDATION_ERROR,
  START_DATE_VALIDATION_ERROR,
} from "../constants";
import { errors, requestContext } from "../libraries";

/**
 * Validates the start and end dates.
 * @param startDate - The starting date.
 * @param endDate - The ending date.
 */
export const validateDate = (
  startDate: Date | undefined,
  endDate: Date | undefined,
): void => {
  /**
   * Checks if the start date is provided and if it's in the past.
   * Throws an InputValidationError if the start date is invalid.
   */
  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    throw new errors.InputValidationError(
      requestContext.translate(START_DATE_VALIDATION_ERROR.MESSAGE),
      START_DATE_VALIDATION_ERROR.CODE,
      START_DATE_VALIDATION_ERROR.PARAM,
    );
  }

  /**
   * Checks if the end date is provided and if it's before the start date.
   * Throws an InputValidationError if the end date is invalid.
   */
  if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
    throw new errors.InputValidationError(
      requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
      END_DATE_VALIDATION_ERROR.CODE,
      END_DATE_VALIDATION_ERROR.PARAM,
    );
  }
};
