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
<<<<<<< HEAD
export const validateDate = (startDate: Date, endDate: Date): void => {
=======
export const validateDate = (
  startDate: Date | undefined,
  endDate: Date | undefined,
): void => {
>>>>>>> develop
  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    throw new errors.InputValidationError(
      requestContext.translate(START_DATE_VALIDATION_ERROR.MESSAGE),
      START_DATE_VALIDATION_ERROR.CODE,
      START_DATE_VALIDATION_ERROR.PARAM,
    );
  }

  //Checks if the end date is valid
<<<<<<< HEAD
  if (endDate && new Date(endDate) < new Date(startDate)) {
=======
  if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
>>>>>>> develop
    throw new errors.InputValidationError(
      requestContext.translate(END_DATE_VALIDATION_ERROR.MESSAGE),
      END_DATE_VALIDATION_ERROR.CODE,
      END_DATE_VALIDATION_ERROR.PARAM,
    );
  }
};
