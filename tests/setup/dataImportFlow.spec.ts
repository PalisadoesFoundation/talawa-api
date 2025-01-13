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

  it("should import sample data if the database is empty and user opts to import", async () => {
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
      shouldImportSampleData: true,
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
    expect(importDataMock).toBeCalled();
  });

  it("should import sample data if the database is empty and user opts not to import", async () => {
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
      shouldImportSampleData: false,
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
      .mockResolvedValueOnce({ importSampleData: true });

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

  it("should not import sample data if the database is not empty and user opts to overwrite and not import sample data", async () => {
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
      .mockResolvedValueOnce({ importSampleData: false });

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

  it("should complete the data importation if the database is not empty and user does not opt to overwrite", async () => {
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

  it("should complete data importation if user opts not to start containers", async () => {
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

  it("should import default data if user does not opt to import sample data", async () => {
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
      .mockResolvedValueOnce({ shouldImportSampleData: false });

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
});
