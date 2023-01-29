import "dotenv/config";
import _ from "lodash";
import { afterEach, describe, expect, it, vi, assert } from "vitest";
import { getTracingId } from "../../src/libraries/requestTracing";

vi.mock('winston', () => {
    const mFormat = {
        colorize: vi.fn(),
        splat: vi.fn(),
        simple: vi.fn(),
        combine: vi.fn(),
        timestamp: vi.fn(),
        printf: vi.fn(),
    };
    const mTransports = {
      Console: vi.fn(),
    };
    const mLogger = {
      info: vi.fn(),
      error: vi.fn()
    };
    return {
      format: mFormat,
      transports: mTransports,
      createLogger: vi.fn(() => mLogger),
    };
});

import { createLogger, transports, format} from "winston";
import { logger } from "../../src/libraries";

describe('logger functions',() => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('basic logger info test', () => {
        const spyLog = vi.spyOn(logger,"info");

        expect(logger).toBeDefined();
        logger.info("Info Test for logger");
        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(spyLog).toBeCalledWith(
            "Info Test for logger"
        );
    });

    it('winston logger error testing', () => {
        const spyLog = vi.spyOn(logger,"error");
        expect(logger).toBeDefined();
        logger.error("Error Test for logger");
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(spyLog).toBeCalledWith(
            "Error Test for logger"
        );
    });
})