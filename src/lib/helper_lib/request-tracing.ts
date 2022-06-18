import cls from 'cls-hooked';
/*
No type defintions available for package 'cls-bluebird'
*/
// @ts-ignore
import clsBluebird from 'cls-bluebird';
import { customAlphabet } from 'nanoid';
import type { NextFunction, Request, Response } from 'express';

/*
Alphabets used in the custom nanoid function
*/
const alphabets = '0123456789abcdefghijklmnopqrstuvwxyz';
/*
Custom nanoid function to generate a unique 10 characters request ID
using the characters in alphabets string
*/
const nanoid = customAlphabet(alphabets, 10);

const requestTracingNamespace = cls.createNamespace('request-tracing');
clsBluebird(requestTracingNamespace);

export const tracingIdHeaderName = 'X-Tracing-Id';
const tracingIdContextKeyName = 'tracingId';

const setTracingId = (tracingId: string) => {
  return requestTracingNamespace.set(tracingIdContextKeyName, tracingId);
};

export const getTracingId = () => {
  return requestTracingNamespace.get(tracingIdContextKeyName) as string;
};

export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
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

export const trace = async (tracingId: string, method: () => any) => {
  await requestTracingNamespace.runAndReturn(async () => {
    setTracingId(tracingId || nanoid());
    return method();
  });
};

export default {
  tracingIdHeaderName,
  getTracingId,
  middleware,
  trace,
};
