export function compareDates(date1: string, date2: string): string {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  const result = dateObj1.getTime() - dateObj2.getTime();
  if (result > 0) {
    return `start date must be earlier than end date`;
  }
  return "";
}
