/* eslint-disable @typescript-eslint/no-explicit-any */
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
  let context: any;
  const mockRequest = new EventEmitter();
  const mockResponse = new EventEmitter();
  const nextFunction = vi.fn();

  interface InterfaceInitOptions<T> extends Record<string, any> {
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
    const options: InterfaceInitOptions<any> = {
      defaultLocale: "fr",
      locale: "fr",
      fallbacks: true,
      lang: "fr",
      requestHandler: vi.fn(),
    };
    const locales = ["en", "fr", "hi", "zh", "sp", "fr"];
    init(options);
    setRequestContext({
      __: vi.fn((args) => args.join(",")),
      __n: vi.fn((args) => args.join(",")),
    });
    expect(translate(locales)).toBe(locales.join(","));
    expect(translatePlural(locales)).toBe(locales.join(","));
    const incorrectOptions: InterfaceInitOptions<any> = {
      defaultLocale: "fr",
      locale: "fr",
      fallbacks: true,
      lang: "fr",
    };
    init(incorrectOptions);
  });

  it("testing error thrown for translate i18n not initialized", () => {
    try {
      translate({});
    } catch (error: any) {
      expect(error.message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });

  it("testing error thrown for translatePlural i18n not initialized", () => {
    try {
      translatePlural({});
    } catch (error: any) {
      expect(error.message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });

  it("should handle missing locale during initialization", () => {
    const options: InterfaceInitOptions<any> = {
      defaultLocale: "fr",
      fallbacks: true,
    };

    const result = init(options);

    expect(result).toEqual({});
  });

  it("should handle incorrect locale during initialization", () => {
    const options: InterfaceInitOptions<any> = {
      defaultLocale: "fr",
      locale: "invalid-locale",
      fallbacks: true,
    };

    const result = init(options);
    expect(result).toEqual({});
  });

  it("should handle missing request handler during initialization", () => {
    const options: InterfaceInitOptions<any> = {
      defaultLocale: "fr",
      locale: "fr",
      fallbacks: true,
    };

    const result = init(options);

    expect(result).toEqual({});
  });

  it("should handle empty options during initialization", () => {
    const result = init();

    expect(result).toEqual({});
  });

  afterEach(() => {
    requestContextNamespace.exit(context);
    vi.restoreAllMocks();
  });
});
