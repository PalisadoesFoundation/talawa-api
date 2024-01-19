import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'
// @ts-ignore
import clsBluebird from "cls-bluebird";
import type { NextFunction, Request, Response } from "express";

// Alphabets used in the custom nanoid function
const alphabets = "0123456789abcdefghijklmnopqrstuvwxyz";

export const requestTracingNamespace = cls.createNamespace("request-tracing");

clsBluebird(requestTracingNamespace);

export const tracingIdHeaderName = "X-Tracing-Id";

const tracingIdContextKeyName = "tracingId";

export const setTracingId = (tracingId: string): string => {
  return requestTracingNamespace.set(tracingIdContextKeyName, tracingId);
};

export const getTracingId = (): string => {
  return requestTracingNamespace.get(tracingIdContextKeyName) as string;
};

export const middleware = (): ((
  req: Request,
  res: Response,
  next: NextFunction
) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Dynamically importing nanoid and then executin rest of the code
    import("nanoid").then((module) => {
      const nanoId = module.customAlphabet(alphabets, 10);

      requestTracingNamespace.bindEmitter(req);
      requestTracingNamespace.bindEmitter(res);

      const tracingId = req.header(tracingIdHeaderName) || nanoId();
      // We need to set header to ensure API gateway which proxies request, forwards the header as well
      req.headers[tracingIdHeaderName] = tracingId;
      res.header(tracingIdHeaderName, tracingId); // Adding tracing ID to response headers
      requestTracingNamespace.run(() => {
        setTracingId(tracingId);
        next();
      });
    });
  };
};

export const trace = async <T>(
  tracingId: string,
  method: () => T
): Promise<void> => {
  const nanoId = await import("nanoid").then((module) => {
    return module.customAlphabet(alphabets, 10);
  });
  await requestTracingNamespace.runAndReturn<T>(() => {
    setTracingId(tracingId || nanoId());
    return method();
  });
};
