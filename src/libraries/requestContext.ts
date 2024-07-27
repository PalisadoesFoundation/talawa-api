/* eslint-disable @typescript-eslint/no-explicit-any */
import cls from "cls-hooked";
import type { NextFunction, Request, Response } from "express";
import i18n from "i18n";

// Create a namespace for managing request context
export const requestContextNamespace = cls.createNamespace(
  "talawa-request-context",
);

/**
 * Sets a value in the request context.
 * @param key - The key under which the value is stored.
 * @param value - The value to store.
 * @returns The stored value.
 */
export const setRequestContextValue = <T>(key: string, value: T): T => {
  return requestContextNamespace.set<string>(key, value);
};

/**
 * Gets a value from the request context.
 * @param key - The key under which the value is stored.
 * @returns The retrieved value.
 */
export const getRequestContextValue = <T>(key: string): T => {
  return requestContextNamespace.get(key);
};

/**
 * Sets the translation functions in the request context.
 * @param obj - The object containing translation functions.
 */
export const setRequestContext = (obj: any): void => {
  setRequestContextValue("translate", obj.__);
  setRequestContextValue("translatePlural", obj.__n);
};

/**
 * Middleware to bind the request and response to the request context namespace.
 */
export const middleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    requestContextNamespace.bindEmitter(req);
    requestContextNamespace.bindEmitter(res);
    requestContextNamespace.run(() => {
      setRequestContext(req);
      next();
    });
  };
};

/**
 * Interface for initialization options.
 */
interface InterfaceInitOptions<T> extends Record<string, any> {
  requestHandler?: () => T;
}

/**
 * Initializes the request context and i18n.
 * @param options - The initialization options.
 * @returns The result of the request handler or an empty object if not provided.
 */
export const init = <T>(options: InterfaceInitOptions<T> = {}): T => {
  const obj: any = {};

  if (!options.lang) {
    // Handle the case where the locale is missing
    return {} as T;
  }

  // Initialize i18n with the provided options
  //@ts-expect-errorts-ignore

  i18n.init(obj);
  obj.setLocale(options.lang);

  return requestContextNamespace.runAndReturn<T>(() => {
    setRequestContext({
      __: obj.__,
      __n: obj.__n,
    });

    // Check if the requestHandler is provided
    if (options.requestHandler) {
      return options.requestHandler();
    } else {
      // Handle the case where the requestHandler is missing
      return {} as T;
    }
  });
};

/**
 * Translates a string using the current context's translation function.
 * @param args - The arguments to pass to the translation function.
 * @returns The translated string.
 */
export const translate = (...args: any): any => {
  const _ = getRequestContextValue("translate");
  if (typeof _ !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return args.map((arg: any) => _(arg)).join(",");
};

/**
 * Translates a plural string using the current context's translation function.
 * @param args - The arguments to pass to the translation function.
 * @returns The translated string.
 */
export const translatePlural = (...args: any): any => {
  const _n = getRequestContextValue("translatePlural");
  if (typeof _n !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return args.map((arg: any) => _n(arg)).join(",");
};
