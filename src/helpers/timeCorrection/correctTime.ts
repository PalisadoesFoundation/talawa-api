export function correct(date: Date | string, time: Date | string): Date {
  const dateObject = date instanceof Date ? date : new Date(date);
  const timeObject = time instanceof Date ? time : new Date(time);

  // Create a new Date object with the date part from dateObject and the time part from timeObject
  const newTime = new Date(dateObject);
  newTime.setHours(timeObject.getHours());
  newTime.setMinutes(timeObject.getMinutes());
  newTime.setSeconds(timeObject.getSeconds());

  return newTime;
}
