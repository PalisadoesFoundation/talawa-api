import "dotenv/config";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock('winston', () => {
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
      error: vi.fn()
    };
    return {
      format: mformat,
      transports: mtransports,
      createLogger: vi.fn(() => mlogger),
    };
});


import { createLogger, transports, format} from "winston";
import { logger } from "../../src/libraries";

describe('logger functions',() => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('logger test should pass', () => {
        const spyInfoLog = vi.spyOn(logger,"info");
        const spyErrorLog = vi.spyOn(logger,"error");

        expect(logger).toBeDefined();
        logger.info("Info Test for logger");
        expect(spyInfoLog).toBeCalledWith(
            "Info Test for logger"
        );

        logger.error("Error Test for logger");
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(spyErrorLog).toBeCalledWith(
            "Error Test for logger"
        );

        expect(createLogger).toBeCalledTimes(1);
        expect(format.combine).toBeCalledTimes(2);
        expect(format.timestamp).toBeCalledWith({ format: 'YYYY-MM-DD HH:mm:ss' });
        expect(transports.Console).toBeCalledTimes(1);
        expect(logger.info).toHaveBeenCalledTimes(1);
    });
})