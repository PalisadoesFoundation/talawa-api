// console.log(new Date("2024-01-22T04:40:39.159Z").toLocaleTimeString());
let tomorrow = new Date();
console.log(tomorrow.toDateString());
console.log(tomorrow.toLocaleTimeString());
console.log(tomorrow.toUTCString());
console.log(tomorrow);

tomorrow.setDate(tomorrow.getDate() + 1);
console.log(tomorrow.toDateString());
console.log(tomorrow.toLocaleTimeString());
console.log(tomorrow.toUTCString());
