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

  const ignorePatternRegex = /# MinIO data directory\n[^\n]+\/\*\*\n/g;

  content = content.replace(ignorePatternRegex, "");

  if (!content.includes(ignorePattern)) {
    content += `\n# MinIO data directory\n${ignorePattern}\n`;
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath} with MinIO data directory.`);
  }
};
