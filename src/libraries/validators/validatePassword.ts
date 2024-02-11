// export function validatePassword(password: string): boolean {
//   const uppercaseRegex = /[A-Z]/;
//   const lowercaseRegex = /[a-z]/;
//   const numberRegex = /[0-9]/;
//   const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
//   const emojiRegex =
//     /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/u;

//   if (
//     password.length >= 8 &&
//     password.length <= 50 &&
//     uppercaseRegex.test(password) &&
//     lowercaseRegex.test(password) &&
//     numberRegex.test(password) &&
//     symbolRegex.test(password) &&
//     !emojiRegex.test(password)
//   ) {
//     return true;
//   } else {
//     return false;
//   }
// }
