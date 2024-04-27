import type winston from "winston";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TransactionLogTypes } from "../../src/constants";

const mockPreFunction = vi.fn();
const mockPostFunction = vi.fn();

const mockSchema = {
  pre: mockPreFunction,
  post: mockPostFunction,
};

const mockDocument = {
  logInfo: {
    timestamp: "",
    model: "",
    type: "",
  },
};

const mockQuery = {
  logInfo: {
    timestamp: "",
    model: "",
    type: "",
  },
  getQuery: vi.fn(() => ({})),
  getUpdate: vi.fn(() => ({})),
};

const testLogEntry = {
  timestamp: new Date().toISOString(),
  model: "TestModel",
  type: TransactionLogTypes.CREATE,
  query: "Example query",
  update: "Example update",
};

describe("Database transaction logging", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  it("Logger should be null if process.env.LOG=false", async () => {
    process.env.LOG = "false";
    process.env.LOG_PATH = "";

    const { default: dbLogger, createLoggingMiddleware } = await import(
      "../../src/libraries/dbLogger"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createLoggingMiddleware(mockSchema as any, "TestModel");

    expect(dbLogger).toBe(null);
  });

  it("Logger should be defined and log succesfully if process.env.LOG=true", async () => {
    process.env.LOG = "true";
    process.env.LOG_PATH = "./logs/test.log";

    const { default: dbLogger } = await import("../../src/libraries/dbLogger");

    expect(dbLogger).not.toBeNull();

    if (dbLogger) {
      const spyInfoLog = vi.spyOn(dbLogger, "info");
      dbLogger.info("success", testLogEntry);
      expect(spyInfoLog).toBeCalledWith("success", testLogEntry);
    }
  });

  it("createLoggingMiddleware should enable mongoose middlewares succesfully", async () => {
    process.env.LOG = "true";
    process.env.LOG_PATH = "./logs/test.log";

    const { createLoggingMiddleware } = await import(
      "../../src/libraries/dbLogger"
    );
    const { default: dbLogger } = await import("../../src/libraries/dbLogger");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createLoggingMiddleware(mockSchema as any, "TestModel");

    const spyInfoLog = vi.spyOn(dbLogger as winston.Logger, "info");

    const savePreMiddleware = mockPreFunction.mock.calls.find(
      (call) => call[0] === "save",
    )?.[1];
    savePreMiddleware.call(mockDocument, () => {
      return;
    });
    expect(mockDocument.logInfo).toBeDefined();
    const savePostMiddleware = mockPostFunction.mock.calls.find(
      (call) => call[0] === "save",
    )?.[1];
    savePostMiddleware.call(mockDocument);
    expect(spyInfoLog).toHaveBeenCalledWith("success", mockDocument.logInfo);

    const operations = [
      "findOneAndUpdate",
      "updateOne",
      "updateMany",
      "deleteOne",
      "deleteMany",
    ];
    operations.forEach((operation) => {
      const preMiddleware = mockPreFunction.mock.calls.find(
        (call) => call[0] === operation,
      )?.[1];
      preMiddleware.call(mockQuery, () => {
        return;
      });
      expect(mockQuery.logInfo).toBeDefined();
      const postMiddleware = mockPostFunction.mock.calls.find(
        (call) => call[0] === operation,
      )?.[1];
      postMiddleware.call(mockQuery);
      expect(spyInfoLog).toHaveBeenCalledWith("success", mockQuery.logInfo);
    });
  });
});
