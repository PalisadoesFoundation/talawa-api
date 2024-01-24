export function correct(date: Date, time: Date): Date {
  const newTime = new Date(date);
  // Set the time part from the time object
  newTime.setHours(time.getHours());
  newTime.setMinutes(time.getMinutes());
  newTime.setSeconds(time.getSeconds());

  return newTime;
}



