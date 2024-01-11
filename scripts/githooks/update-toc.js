const fs = require("fs");
const { execSync } = require("child_process");

const markdownFiles = fs
  .readdirSync("./")
  .filter((file) => file.endsWith(".md"));

markdownFiles.forEach((file) => {
  const command = `markdown-toc -i "${file}" --bullets "-"`;
  execSync(command, { stdio: "inherit" });
});
console.log("Table of contents updated successfully.");
