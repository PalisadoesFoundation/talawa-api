import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  requestContextNamespace,
  setRequestContextValue,
  getRequestContextValue,
  setRequestContext,
  middleware,
  init,
  translate,
  translatePlural,
} from "../../src/libraries/requestContext";
import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "stream";

describe("middleware -> requestContext", () => {
  const value = uuidv4();
  let context: unknown;
  const mockRequest = new EventEmitter();
  const mockResponse = new EventEmitter();
  const nextFunction = vi.fn();

  interface InterfaceInitOptions<T>
    extends Record<string | number | symbol, unknown> {
    requestHandler?: () => T;
  }

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
      nextFunction as NextFunction,
    );
    expect(nextFunction).toBeCalledTimes(1);
  });

  it("testing i18n api with translate and translatePlural", () => {
    const options: InterfaceInitOptions<unknown> = {
      defaultLocale: "fr",
      locale: "fr",
      fallbacks: true,
      lang: "fr",
      requestHandler: vi.fn(),
    };
    const locales = ["en", "fr", "hi", "zh", "sp", "fr"];
    init(options);
    setRequestContext({
      __: vi.fn((x) => x),
      __n: vi.fn((x) => x),
    });
    expect(translate(locales)).toBe(locales);
    expect(translatePlural(locales)).toBe(locales);
  });

  it("testing error thrown for translate i18n not initialized", () => {
    try {
      translate({});
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });

  it("testing error thrown for translatePlural i18n not initialized", () => {
    try {
      translatePlural({});
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });

  it("test for handling missing locale during initialization", () => {
    const options = {
      defaultLocale: "fr",
      fallbacks: true,
      lang: "fr",
      requestHandler: vi.fn(),
    };
    expect(() => init(options)).toThrowError();
  });

  it("test for handling incorrect locale during initialization", () => {
    const options = {
      defaultLocale: "fr",
      locale: "invalid-locale",
      fallbacks: true,
      lang: "fr",
      requestHandler: vi.fn(),
    };
    expect(() => init(options)).toThrowError();
  });

  it("test for handling missing request handler during initialization", () => {
    const options = {
      defaultLocale: "fr",
      locale: "fr",
      lang: "fr",
      fallbacks: true,
    };
    expect(() => init(options)).toThrowError();
  });

  it("test for handling empty options for init", () => {
    const options = {};
    expect(() => init(options)).toThrowError();
  });
  afterEach(() => {
    requestContextNamespace.exit(context);
    vi.restoreAllMocks();
  });
});
