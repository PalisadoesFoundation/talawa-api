/**
 * This function converts the date to UTC.
 * @param date - the date to be converted.
 * @returns converted date.
 */

export const convertToUTCDate = (date: Date): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create a new date object with local year, month, day but at UTC midnight
  const utcMidnight = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

  return utcMidnight;
};

/**
 * This function converts the date to a valid rrule string argument.
 * @param date - the date string to be converted.
 * @returns converted date string.
 */

export const convertToRRuleDateString = (date: Date): string => {
  let dateString = date.toISOString();

  dateString = dateString.replace(/[-:]/g, "");

  dateString = dateString.replace(/\.\d{3}/, "");

  return dateString;
};
