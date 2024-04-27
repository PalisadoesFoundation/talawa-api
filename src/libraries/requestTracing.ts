import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'
// @ts-expect-error--ts-ignore
import clsBluebird from "cls-bluebird";
import { customAlphabet } from "nanoid";
import type { NextFunction, Request, Response } from "express";

// Alphabets used in the custom nanoid function
const alphabets = "0123456789abcdefghijklmnopqrstuvwxyz";

/*
Custom nanoid function to generate a unique 10 characters request ID
using the characters in alphabets variable
*/
const nanoid = customAlphabet(alphabets, 10);

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

export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requestTracingNamespace.bindEmitter(req);
    requestTracingNamespace.bindEmitter(res);

    const tracingId = req.header(tracingIdHeaderName) || nanoid();
    // We need to set header to ensure API gateway which proxies request, forwards the header as well
    req.headers[tracingIdHeaderName] = tracingId;
    res.header(tracingIdHeaderName, tracingId); // Adding tracing ID to response headers

    requestTracingNamespace.run(() => {
      setTracingId(tracingId);
      next();
    });
  };
};

export const trace = async <T>(
  tracingId: string,
  method: () => T,
): Promise<void> => {
  await requestTracingNamespace.runAndReturn<T>(() => {
    setTracingId(tracingId || nanoid());
    return method();
  });
};
