import * as fs from "fs";
import path from "path";

export const updateIgnoreFile = (
  filePath: string,
  directoryToIgnore: string,
): void => {
  const projectRoot = process.cwd();
  const relativePath = path.relative(projectRoot, directoryToIgnore);
  const ignorePattern = relativePath + "/**";

  const isInsideProjectRoot =
    !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

  if (!isInsideProjectRoot) {
    return;
  }

  let content = "";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }

  // If the ignorePattern already exists in the content, return early.
  // There's no need to modify the file if the pattern is already present, as it's redundant to add the same pattern again.
  // No log is necessary here because this is a normal, expected case where no changes are needed.
  if (content.includes(ignorePattern)) {
    return;
  }

  // This regex looks for:
  // 1. A line starting with "# MinIO data directory" followed by a newline (\n).
  // 2. Any path (one or more non-newline characters [^\n]+) followed by "/**" (escaped as \/ and \*).
  // 3. It matches the entire pattern up to the next newline (\n), allowing us to remove the MinIO data entry.
  const ignorePatternRegex = /# MinIO data directory\n[^\n]+\/\*\*\n/g;

  content = content.replace(ignorePatternRegex, "");

  if (!content.includes(ignorePattern)) {
    content += `\n# MinIO data directory\n${ignorePattern}\n`;
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath} with MinIO data directory.`);
  }
};
