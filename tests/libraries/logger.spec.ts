import "dotenv/config";
import { describe, expect, it, vi } from "vitest";
import { appConfig } from "./../../src/config/appConfig";

vi.mock("winston", () => {
  const mformat = {
    colorize: vi.fn(),
    splat: vi.fn(),
    simple: vi.fn(),
    combine: vi.fn(),
    timestamp: vi.fn(),
    printf: vi.fn(),
  };
  const mtransports = {
    Console: vi.fn(),
  };
  const mlogger = {
    info: vi.fn(),
    error: vi.fn(),
    stram: vi.fn(),
  };
  return {
    format: mformat,
    transports: mtransports,
    createLogger: vi.fn(() => mlogger),
  };
});

import { createLogger, transports, format } from "winston";
import { logger, stream } from "../../src/libraries";

describe("logger functions", () => {
  it("basic logger test should pass", () => {
    const spyInfoLog = vi.spyOn(logger, "info");
    const spyErrorLog = vi.spyOn(logger, "error");

    expect(logger).toBeDefined();
    logger.info("Info Test for logger");
    expect(spyInfoLog).toBeCalledWith("Info Test for logger");

    logger.error("Error Test for logger");
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(spyErrorLog).toBeCalledWith("Error Test for logger");

    expect(createLogger).toBeCalledTimes(1);
    expect(format.printf).toBeCalledWith(expect.any(Function));
    expect(format.combine).toBeCalledTimes(2);
    expect(format.timestamp).toBeCalledWith({ format: "YYYY-MM-DD HH:mm:ss" });
    expect(transports.Console).toBeCalledTimes(1);
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it("logger stream testing", () => {
    const spyInfoLog = vi.spyOn(logger, "info");
    stream.write("Testing for logger streaming");
    expect(spyInfoLog).toBeCalledWith("Testing for logger streaming");

    // sending message null or undefined to get the "" <- msg as logger.info
    stream.write(null);
    expect(spyInfoLog).toBeCalledWith("");
  });

  it("testing console colorization", () => {
    if (appConfig.colorize_logs === "true") {
      // Since the actual function's aren't called in the logger, they can't be mocked and spied upon
      // Thus to check we will use the number of arguments being combined in the fomat.combine method
      expect(format.combine).toHaveBeenCalledWith(
        undefined, // colorize()
        undefined, // splat()
        undefined, // simple()
        undefined, // timestamp()
        undefined, // printf()
      );
    } else {
      expect(format.combine).toHaveBeenCalledWith(
        undefined, // splat()
        undefined, // simple()
        undefined, // timestamp()
        undefined, // printf()
      );
    }
  });
});
