import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'
// @ts-expect-error--ts-ignore
import clsBluebird from "cls-bluebird";
import type { NextFunction, Request, Response } from "express";

// Alphabets used in the custom nanoid function
const alphabets = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Custom nanoid function to generate a unique 10 characters request ID
 * using the characters in the alphabets variable.
 */

/**
 * Namespace for request tracing to maintain context across asynchronous operations.
 */
export const requestTracingNamespace = cls.createNamespace("request-tracing");

// Initialize cls-bluebird with the request tracing namespace
clsBluebird(requestTracingNamespace);

/**
 * Name of the header where the tracing ID will be stored.
 */
export const tracingIdHeaderName = "X-Tracing-Id";

/**
 * Key name for storing the tracing ID in the namespace context.
 */
const tracingIdContextKeyName = "tracingId";

const getNanoid: () => Promise<() => string> = async () => {
  const { customAlphabet } = await import("nanoid");
  return customAlphabet(alphabets, 10);
};
/**
 * Sets the tracing ID in the namespace context.
 * @param tracingId - The tracing ID to set.
 * @returns The tracing ID that was set.
 */
export const setTracingId = (tracingId: string): string => {
  return requestTracingNamespace.set(tracingIdContextKeyName, tracingId);
};

/**
 * Gets the tracing ID from the namespace context.
 * @returns The tracing ID.
 */
export const getTracingId = (): string => {
  return requestTracingNamespace.get(tracingIdContextKeyName) as string;
};

/**
 * Middleware to handle request tracing. It generates or retrieves a tracing ID,
 * sets it in the headers of the request and response, and stores it in the namespace context.
 * @returns A middleware function.
 */
export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requestTracingNamespace.bindEmitter(req);
    requestTracingNamespace.bindEmitter(res);

    getNanoid().then((nanoid) => {
      const tracingId = req.header(tracingIdHeaderName) || nanoid();
      req.headers[tracingIdHeaderName] = tracingId;
      res.header(tracingIdHeaderName, tracingId);

      requestTracingNamespace.run(() => {
        setTracingId(tracingId);
        next();
      });
    })
    .catch((error)=>{
      next(error);
    })
  };
};

/**
 * Runs a method within the context of a tracing ID. If a tracing ID is provided, it uses that ID;
 * otherwise, it generates a new one.
 * @param tracingId - The tracing ID to use.
 * @param method - The method to run within the context of the tracing ID.
 * @returns A promise that resolves when the method completes.
 */
export const trace = async <T>(
  tracingId: string,
  method: () => T,
): Promise<void> => {
    const nanoid = await getNanoid();
    await requestTracingNamespace.runAndReturn<T>(() => {
      setTracingId(tracingId || nanoid());
      return method();
    });
};
