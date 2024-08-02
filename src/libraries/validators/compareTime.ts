/**
 * Compares two times and returns a message if the first time is later than the second time.
 *
 * @param time1 - The first time as a string.
 * @param time2 - The second time as a string.
 * @returns A message indicating that the start time must be earlier than the end time, or an empty string if the times are in the correct order.
 */
export function compareTime(time1: string, time2: string): string {
  // Convert the time strings to Date objects
  const timeObj1 = new Date(time1);
  const timeObj2 = new Date(time2);

  // Calculate the difference in hours between the two times
  const result = timeObj1.getHours() - timeObj2.getHours();

  // If the first time is later than the second time, return an error message
  if (result > 0) {
    return `start time must be earlier than end time`;
  }

  // Return an empty string if the times are in the correct order
  return "";
}
