import { EventEmitter } from "stream";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  requestTracingNamespace,
  setTracingId,
  getTracingId,
  trace,
  middleware,
  tracingIdHeaderName,
} from "../../src/libraries/requestTracing";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { customAlphabet } from "nanoid";

describe("middleware -> requestContext", () => {
  let context: any;
  const tracingIdContextKeyName = "tracingId";
  const alphabets = "0123456789abcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabets, 10);

  const mockRequest = new EventEmitter();
  const mockResponse = new EventEmitter();
  const nextFunction = vi.fn();

  beforeEach(() => {
    context = requestTracingNamespace.createContext();
    requestTracingNamespace.enter(context);
  });

  it("basic storing and retrieving the key value pair", () => {
    requestTracingNamespace.set(tracingIdContextKeyName, "value");
    const response = requestTracingNamespace.get(tracingIdContextKeyName);
    expect(response).toBe("value");
  });

  it("test basic getTracingID and setTracingID functions", () => {
    const value = uuidv4();
    expect(setTracingId(value)).toBe(value);
    expect(getTracingId()).toBe(value);
  });

  it("testing the requestTracing Middleware", () => {
    const ReqheaderMethod = (tracingIdHeaderName: string) => {
      return requestTracingNamespace.get(tracingIdHeaderName);
    };
    const ResHeaderMethod = (
      tracingIdHeaderName: string,
      tracingID: string
    ) => {
      return requestTracingNamespace.set(tracingIdHeaderName, tracingID);
    };
    const myHeaders = new Headers();
    myHeaders.append("X-Tracing-Id", "UserTracingId");
    // @ts-ignore
    mockRequest.header = ReqheaderMethod;
    // @ts-ignore
    mockRequest.headers = myHeaders;
    // @ts-ignore
    mockResponse.header = ResHeaderMethod;
    middleware()(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );
    expect(tracingIdHeaderName).toBe("X-Tracing-Id");
    expect(nextFunction).toBeCalledTimes(1);
  });

  it("test trace function with tracingID provided", async () => {
    const method = () => {
      return "method";
    };
    const tracingID = uuidv4();
    await trace(tracingID, method);
    expect(setTracingId(tracingID)).toBe(tracingID);
  });
  it("test trace function with tracingID as empty string", async () => {
    const method = () => {
      return "method";
    };
    const tracingID = "";
    const setNanoidValue = nanoid();
    await trace(tracingID, method);
    expect(setTracingId(setNanoidValue)).toBe(setNanoidValue);
  });
  afterEach(() => {
    requestTracingNamespace.exit(context);
    vi.restoreAllMocks();
  });
});
