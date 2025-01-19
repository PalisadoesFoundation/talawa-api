import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import { dataImportWithoutDocker, dataImportWithDocker } from "../../setup";
import inquirer from "inquirer";

describe("Data Importation Without Docker", () => {
  const mockEnv = { ...process.env }; // Backup the environment variables

  beforeEach(() => {
    process.env.MONGO_DB_URL = "mongodb://localhost:27017/sample-table";
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = { ...mockEnv }; // Restore environment variables
  });

  it("should import default data if the database is empty and user opts to import default data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return true;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldImportDefaultData: true,
    });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should import sample data if the database is empty and user opts not to import default data but import sample data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return true;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldImportDefaultData: false })
      .mockResolvedValueOnce({ shouldImportSampleData: true });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).toBeCalled();
  });

  it("should do no-op if the database is empty and user imports neither default nor sample data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return true;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldImportDefaultData: false })
      .mockResolvedValueOnce({ shouldImportSampleData: false });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should import sample data if the database is not empty and user opts to overwrite and import sample data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return false;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldOverwriteData: true })
      .mockResolvedValueOnce({ overwriteDefaultData: false })
      .mockResolvedValueOnce({ overwriteSampleData: true });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).toBeCalled();
  });

  it("should import default data if the database is not empty and user opts to overwrite and import default data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return false;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldOverwriteData: true })
      .mockResolvedValueOnce({ overwriteDefaultData: true });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).toBeCalled();
    expect(importDefaultDataMock).toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should  do no-op if db not empty and user imports neither default nor sample data", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return false;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldOverwriteData: true })
      .mockResolvedValueOnce({ overwriteDefaultData: false })
      .mockResolvedValueOnce({ overwriteSampleData: false });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should do no-op if db not empty and user opts not to overwrite", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return false;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldOverwriteData: false,
    });

    await dataImportWithoutDocker(
      checkDbMock,
      wipeExistingDataMock,
      importDefaultDataMock,
      importDataMock,
    );
    expect(checkDbMock).toBeCalled();
    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should handle database connection failure gracefully", async () => {
    const checkDbMock = vi
      .fn()
      .mockImplementation(async (): Promise<boolean> => {
        return false;
      });
    const wipeExistingDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const errorMessage = "Database connection failed";
    checkDbMock.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      dataImportWithoutDocker(
        checkDbMock,
        wipeExistingDataMock,
        importDefaultDataMock,
        importDataMock,
      ),
    ).rejects.toThrow(errorMessage);

    expect(wipeExistingDataMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });
});

describe("Data Importation With Docker", () => {
  const mockEnv = { ...process.env }; // Backup the environment variables

  beforeEach(() => {
    process.env.MONGO_DB_URL = "mongodb://localhost:27017/sample-table";
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = { ...mockEnv }; // Restore environment variables
  });

  it("should do no-op if user opts not to start containers", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldStartDockerContainers: false,
    });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).not.toBeCalled();
    expect(connectDatabaseMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should terminate execution if error is encountered while starting containers", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        throw new Error("Error starting containers");
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldStartDockerContainers: true,
    });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).not.toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should terminate execution if error is encountered while connecting to database", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        throw new Error("Error starting containers");
      });
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldStartDockerContainers: true,
    });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should import default data if user opts to import default data", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldStartDockerContainers: true })
      .mockResolvedValueOnce({ shouldImportDefaultData: true });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).toBeCalled();
    expect(importDefaultDataMock).toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should import sample data if user opts to import sample data", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldStartDockerContainers: true })
      .mockResolvedValueOnce({ shouldImportDefaultData: false })
      .mockResolvedValueOnce({ shouldImportSampleData: true });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).toBeCalled();
  });

  it("should do no-op if user opts to import neither sample data nor default data", async () => {
    const runDockerComposeMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const importDefaultDataMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    const connectDatabaseMock = vi
      .fn()
      .mockImplementation(async (): Promise<void> => {
        return Promise.resolve();
      });
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ shouldStartDockerContainers: true })
      .mockResolvedValueOnce({ shouldImportDefaultData: false })
      .mockResolvedValueOnce({ shouldImportSampleData: false });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );
    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).toBeCalled();
    expect(importDefaultDataMock).not.toBeCalled();
    expect(importDataMock).not.toBeCalled();
  });

  it("should handle Docker container startup timeout", async () => {
    const runDockerComposeMock = vi.fn().mockImplementation(async () => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Docker compose operation timed out"));
        }, 3000);
      });
    });
    const importDataMock = vi.fn();
    const importDefaultDataMock = vi.fn();
    const connectDatabaseMock = vi.fn();

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      shouldStartDockerContainers: true,
    });

    await dataImportWithDocker(
      runDockerComposeMock,
      importDefaultDataMock,
      importDataMock,
      connectDatabaseMock,
    );

    expect(runDockerComposeMock).toBeCalled();
    expect(connectDatabaseMock).not.toBeCalled();
  });
});
