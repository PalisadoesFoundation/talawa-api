import * as fs from "fs";
import path from "path";

/**
 * Updates the specified ignore file by adding an ignore pattern for a given directory.
 *
 * This function ensures that the directory to be ignored is relative to the project root.
 * It reads the current content of the ignore file, removes any existing entries for the MinIO data directory,
 * and appends a new entry if it does not already exist.
 *
 * @param filePath - The path to the ignore file to be updated.
 * @param directoryToIgnore - The directory path that should be ignored, relative to the project root.
 *
 * @returns void
 *
 * @remarks
 * If the directory is outside the project root, the function will return early without making changes.
 * No logging is performed for cases where the ignore pattern already exists in the file, as this is expected behavior.
 */
export const updateIgnoreFile = (
  filePath: string,
  directoryToIgnore: string,
): void => {
  const projectRoot = process.cwd();
  const relativePath = path.relative(projectRoot, directoryToIgnore);
  const ignorePattern = relativePath + "/**";

  const isInsideProjectRoot =
    !relativePath.startsWith("..") && !path.isAbsolute(relativePath);

  // If the directory is outside the project root, simply return without doing anything.
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

  /**
   * This regex looks for:
   * 1. A line starting with "# MinIO data directory" followed by a newline (\\n).
   * 2. Any path (one or more non-newline characters [^\\n]+) followed by "/**" (escaped as \/ and \*).
   * 3. It matches the entire pattern up to the next newline (\\n), allowing us to remove the MinIO data entry.
   */
  const ignorePatternRegex = /# MinIO data directory\n[^\n]+\/\*\*\n/g;

  content = content.replace(ignorePatternRegex, "");

  if (!content.includes(ignorePattern)) {
    content += `\n# MinIO data directory\n${ignorePattern}\n`;
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath} with MinIO data directory.`);
  }
};
