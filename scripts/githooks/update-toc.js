// eslint-disable-next-line @typescript-eslint/no-var-requires
import fs from "fs";
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { execSync } from "child_process";

const markdownFiles = fs
  .readdirSync("./")
  .filter((file) => file.endsWith(".md"));

markdownFiles.forEach((file) => {
  const command = `npx markdown-toc -i "${file}" --bullets "-"`;
  execSync(command, { stdio: "inherit" });
});
console.log("Table of contents updated successfully.");
