/**
 * Compares two dates and returns a message if the first date is later than the second date.
 *
 * @param date1 - The first date as a string.
 * @param date2 - The second date as a string.
 * @returns A message indicating that the start date must be earlier than the end date, or an empty string if the dates are in the correct order.
 */
export function compareDates(date1: string, date2: string): string {
  // Convert the date strings to Date objects
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);

  // Calculate the difference in time between the two dates
  const result = dateObj1.getTime() - dateObj2.getTime();

  // If the first date is later than the second date, return an error message
  if (result > 0) {
    return `start date must be earlier than end date`;
  }

  // Return an empty string if the dates are in the correct order
  return "";
}
