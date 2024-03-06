export function compareTime(time1: string, time2: string): string {
  const timeObj1 = new Date(time1);
  const timeObj2 = new Date(time2);
  const result = timeObj1.getHours() - timeObj2.getHours();
  if (result > 0) {
    return `start time must be earlier than end time`;
  }
  return "";
}
