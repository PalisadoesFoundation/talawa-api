import * as fs from "fs/promises";
import * as path from "path";

interface InterfaceTestResult {

  file: string;
  hasAsyncOperations: boolean;
  hasSharedResources: boolean;
  hasDependencies: boolean;
  content: string;
}

class TestSuiteAnalyzer {
  private _testResults: Map<string, InterfaceTestResult> = new Map();
  private _debug: boolean = true;

  constructor(private _testDir: string) {
    // Ensure testDir is absolute
    this._testDir = path.resolve(_testDir);
    this._log(`Initialized analyzer with directory: ${this._testDir}`);
  }

  private _log(message: string): void {
    if (this._debug) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  public async analyze(): Promise<void> {
    try {
      const testFiles = await this._findTestFiles();
      this._log(`Found ${testFiles.length} test files`);

      if (testFiles.length === 0) {
        console.error("\nNo test files found! Checking common issues:");
        await this._diagnoseNoFiles();
        return;
      }

      console.log("\nFound test files:");
      testFiles.forEach((file, index) => console.log(`${index + 1}. ${file}`));

      await this._parseTestFiles(testFiles);
      await this._generateReport();
    } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
    }
  }

  private async _findTestFiles(): Promise<string[]> {
    const testFiles: string[] = [];

    const searchDirectory = async (dir: string): Promise<void> => {
      this._log(`Searching directory: ${dir}`);

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.includes("node_modules")) {
            await searchDirectory(fullPath);
          } else if (
            entry.isFile() &&
            (entry.name.endsWith(".test.ts") ||
              entry.name.endsWith(".spec.ts") ||
              entry.name.endsWith(".test.tsx") ||
              entry.name.endsWith(".spec.tsx"))
          ) {
            this._log(`Found test file: ${fullPath}`);
            testFiles.push(fullPath);
          }
        }
      } catch (error) {
        this._log(
          `Error reading directory ${dir}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    await searchDirectory(this._testDir);
    return testFiles;
  }

  private async _diagnoseNoFiles(): Promise<void> {
    console.log("\nRunning diagnostics...");

    // Check 1: Directory exists
    console.log(`\n1. Checking if directory exists: ${this._testDir}`);
    try {
      await fs.access(this._testDir);
      console.log("✓ Directory exists");
    } catch {
      console.log("❌ Directory does not exist!");
      console.log("Try running the script from your project root directory.");
      return;
    }

    // Check 2: Directory contents
    console.log("\n2. Listing directory contents:");
    try {
      const files = await fs.readdir(this._testDir);
      files.forEach((file, index) => console.log(`   ${index + 1}. ${file}`));
    } catch (dirError) {
      console.log(
        `Error reading directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`,
      );
    }

    // Check 3: Common test directories
    const commonTestDirs = ["./tests"];

    console.log("\n3. Checking common test directories:");
    commonTestDirs.forEach((dir, index) => {
      const fullPath = path.join(process.cwd(), dir);
      try {
        fs.access(fullPath);
        console.log(`${index + 1}. ✓ Found: ${dir}`);
        console.log("   Try running the analyzer with this path instead.");
      } catch {
        // Directory doesn't exist, skip
      }
    });

    // Check 4: Project structure
    console.log("\n4. Checking package.json:");
    try {
      const packageJson = JSON.parse(
        await fs.readFile(path.join(process.cwd(), "package.json"), "utf8"),
      );
      console.log(
        "   Test script:",
        packageJson.scripts?.test || "No test script found",
      );
      console.log(
        "   Jest config:",
        packageJson.jest ? "✓ Found" : "❌ Not found",
      );
    } catch {
      // Removed unused pkgError variable
      console.log("   ❌ No package.json found");
    }
  }

  private async _parseTestFiles(files: string[]): Promise<void> {
    for (const file of files) {
      this._log(`Parsing file: ${file}`);

      try {
        const content = await fs.readFile(file, "utf8");

        const hasAsyncOperations =
          content.includes("async") || content.includes("Promise");
        const hasSharedResources =
          content.includes("beforeAll") ||
          content.includes("afterAll") ||
          content.includes("db.") ||
          content.includes("database") ||
          content.includes("fs.") ||
          content.includes("writeFile") ||
          content.includes("readFile");

        const hasDependencies =
          content.includes("beforeEach") || content.includes("afterEach");

        if (hasAsyncOperations || hasSharedResources || hasDependencies) {
          this._testResults.set(file, {
            file,
            hasAsyncOperations,
            hasSharedResources,
            hasDependencies,
            content,
          });
        }
      } catch (error) {
        this._log(
          `Error parsing file ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private async _generateReport(): Promise<void> {
    let report = "Test Suite Analysis Report\n";
    report += "========================\n\n";

    report += `Total Tests Analyzed: ${this._testResults.size}\n\n`;

    if (this._testResults.size > 0) {
      report += "Tests Requiring Attention:\n";
      report += "========================\n\n";

      let testNumber = 1;
      for (const [file, data] of this._testResults) {
        report += `Test #${testNumber}: ${path.relative(process.cwd(), file)}\n`;
        report += "--------------------\n";

        if (data.hasAsyncOperations) {
          report += "- Contains async operations (potential race conditions)\n";
        }

        if (data.hasSharedResources) {
          report +=
            "- Accesses shared resources (database, filesystem, etc.)\n";
        }

        if (data.hasDependencies) {
          report += "- Has test dependencies (beforeEach/afterEach hooks)\n";
        }

        report += "\n";
        testNumber++;
      }

      report += "\nRecommendations:\n";
      report += "----------------\n";
      report += "1. Consider running identified tests sequentially\n";
      report += "2. Add proper cleanup in afterEach/afterAll blocks\n";
      report += "3. Isolate shared resource access\n";
      report += "4. Implement proper wait conditions for async operations\n";
    } else {
      report += "No tests requiring sequential execution were identified.\n";
    }

    // Write report to file
    const reportPath = path.join(process.cwd(), "test-analysis-report.txt");
    await fs.writeFile(reportPath, report);
    console.log(`\nAnalysis complete. Report written to: ${reportPath}`);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let testDir = "./tests";

const dirArg = args.find((arg) => arg.startsWith("--dir="));
if (dirArg) {
  testDir = dirArg.split("=")[1];
}

console.log(`Starting test suite analysis in directory: ${testDir}\n`);

const analyzer = new TestSuiteAnalyzer(testDir);
analyzer.analyze().catch((error) => {
  console.error(
    "Analysis failed:",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

export { TestSuiteAnalyzer };
