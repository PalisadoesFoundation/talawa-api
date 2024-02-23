import cls from "cls-hooked";
// No type defintions available for package 'cls-bluebird'
// @ts-ignore
import clsBluebird from "cls-bluebird";
import i18n from "i18n";
import type { NextFunction, Request, Response } from "express";

export const requestContextNamespace = cls.createNamespace(
  "talawa-request-context",
);

clsBluebird(requestContextNamespace);

export const setRequestContextValue = <T>(key: string, value: T): T => {
  //@ts-ignore
  return requestContextNamespace.set<T>(key, value);
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
  // @ts-ignore
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
  const translateFunction = getRequestContextValue("translate");
  if (typeof translateFunction !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return translateFunction(...args);
};

export const translatePlural = (...args: any): any => {
  const translatePluralFunction = getRequestContextValue("translatePlural");
  if (typeof translatePluralFunction !== "function") {
    throw new Error("i18n is not initialized, try app.use(i18n.init);");
  }
  return translatePluralFunction(...args);
};
