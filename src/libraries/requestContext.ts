/* eslint-disable @typescript-eslint/no-explicit-any */
import cls from "cls-hooked";
import type { NextFunction, Request, Response } from "express";
import i18n from "i18n";

export const requestContextNamespace = cls.createNamespace(
  "talawa-request-context",
);

export const setRequestContextValue = <T>(key: string, value: T): T => {
  return requestContextNamespace.set<string>(key, value);
};

export const getRequestContextValue = <T>(key: string): T => {
  return requestContextNamespace.get(key);
};

export const setRequestContext = (obj: any): void => {
  setRequestContextValue("translate", obj.__);
  setRequestContextValue("translatePlural", obj.__n);
};

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

interface InterfaceInitOptions<T> extends Record<string, any> {
  requestHandler?: () => T;
}

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

export const translate = (...args: any): any => {
  const _ = getRequestContextValue("translate");
  if (typeof _ !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return args.map((arg: any) => _(arg));
};

export const translatePlural = (...args: any): any => {
  const _n = getRequestContextValue("translatePlural");
  if (typeof _n !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return args.map((arg: any) => _n(arg));
};
