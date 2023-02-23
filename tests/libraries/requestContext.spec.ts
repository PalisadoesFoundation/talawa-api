import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  requestContextNamespace,
  setRequestContextValue,
  getRequestContextValue,
  setRequestContext,
  middleware,
} from "../../src/libraries/requestContext";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "stream";

describe("middleware -> requestContext", () => {
  const value = uuidv4();
  let context: any;
  const mockRequest = new EventEmitter();
  const mockResponse = new EventEmitter();
  const nextFunction = vi.fn();

  beforeEach(() => {
    context = requestContextNamespace.createContext();
    requestContextNamespace.enter(context);
  });

  it("basic storing and retrieving the key value pair", () => {
    requestContextNamespace.set("key", "value");
    const response = requestContextNamespace.get("key");
    expect(response).toBe("value");
  });

  it("tests for setRequestContextValue and getRequestContextValue", () => {
    expect(setRequestContextValue("userId", value)).toBe(value);
    expect(getRequestContextValue("userId")).toBe(value);
  });

  it("test setRequestContext with translate object", () => {
    const obj = {
      __: "translate value",
      __n: "translatePlural value",
    };
    setRequestContext(obj);
    expect(requestContextNamespace.get("translate")).toBe(obj.__);
    expect(requestContextNamespace.get("translatePlural")).toBe(obj.__n);
  });

  it("test requestContext Middleware", () => {
    middleware()(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction as NextFunction
    );
    expect(nextFunction).toBeCalledTimes(1);
  });
  afterEach(() => {
    requestContextNamespace.exit(context);
    vi.restoreAllMocks();
  });
});
