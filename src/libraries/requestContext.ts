/* eslint-disable @typescript-eslint/no-explicit-any */
import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'

// import clsBluebird from "cls-bluebird";
import type { NextFunction, Request, Response } from "express";
import i18n from "i18n";

export const requestContextNamespace = cls.createNamespace(
  "talawa-request-context",
);

// clsBluebird(requestContextNamespace);

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

interface InterfaceInitOptions<T> extends Record<any, any> {
  requestHandler?: () => T;
}

// Invalid code. Currently ignored by typescript. Needs fix.
export const init = <T>(options: InterfaceInitOptions<T> = {}): T => {
  const obj: any = {};
  //@ts-expect-errorts-ignore
  i18n.init(obj);
  obj.setLocale(options.lang);
  return requestContextNamespace.runAndReturn<T>(() => {
    setRequestContext({
      __: obj.__,
      __n: obj.__n,
    });
    // return options.requestHandler?.()!;
    return options.requestHandler != null
      ? options.requestHandler()
      : ({} as T);
  });
};

export const translate = (...args: any): any => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __ = getRequestContextValue("translate");
  if (typeof __ !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return __(...args);
};

export const translatePlural = (...args: any): any => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __n = getRequestContextValue("translatePlural");
  if (typeof __n !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return __n(...args);
};
